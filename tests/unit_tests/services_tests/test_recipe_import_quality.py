"""Source fidelity regressions for recipe imports and French translation."""

import copy
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from mealie.lang.providers import get_locale_provider
from mealie.schema.openai.recipe import OpenAIRecipe, OpenAIRecipeIngredient, OpenAIRecipeInstruction
from mealie.schema.recipe.recipe import Recipe
from mealie.schema.recipe.recipe_ingredient import RecipeIngredient
from mealie.schema.recipe.recipe_step import RecipeStep
from mealie.services.openai.content import extract_page_content
from mealie.services.recipe.import_workflow.compilers.structured_data import StructuredDataCompiler
from mealie.services.recipe.import_workflow.context import WorkflowInput
from mealie.services.recipe.import_workflow.steps.translate_recipe import TranslateRecipeStep
from mealie.services.scraper import cleaner
from mealie.services.scraper.recipe_scraper import RecipeScraper
from mealie.services.scraper.scraped_extras import ScrapedExtras
from mealie.services.scraper.scraper_strategies import prefer_structured_instructions


@pytest.mark.parametrize(
    "image",
    [
        "https://example.test/step.jpg",
        {"url": "https://example.test/step.jpg"},
        {"contentUrl": "https://example.test/step.jpg"},
        {"@id": "https://example.test/step.jpg"},
        ["https://example.test/step.jpg", {"url": "https://example.test/step.jpg"}],
    ],
)
def test_structured_step_images_survive_cleaning(image):
    result = cleaner.clean_instructions([{"text": "Mélanger la farine.", "image": image}])
    assert result[0]["text"] == "Mélanger la farine.\n\n![](https://example.test/step.jpg)"
    assert cleaner.clean_instructions(result) == result
    assert prefer_structured_instructions(result, [{"text": "Mélanger la farine."}])
    assert not prefer_structured_instructions(result, [{"text": "Mélanger puis cuire."}])


def test_section_images_stay_with_their_step():
    source = [
        {
            "@type": "HowToSection",
            "name": "Sauce",
            "itemListElement": [
                {"text": "Mélanger.", "image": "https://example.test/mix.jpg"},
                {"text": "Cuire."},
            ],
        }
    ]
    result = cleaner.clean_instructions(source)
    assert result[0]["title"] == "Sauce"
    assert "mix.jpg" in result[0]["text"]
    assert result[1]["text"] == "Cuire."


@pytest.mark.parametrize("image", ["javascript:alert(1)", "data:image/png;base64,abc", {"url": None}])
def test_invalid_step_images_are_ignored(image):
    assert cleaner.clean_instructions([{"text": "Cuire.", "image": image}]) == [{"text": "Cuire."}]


def test_page_extraction_keeps_image_context_and_json_ld():
    html = """<header><h1>Soupe</h1></header><nav>Other recipes</nav>
    <p>Faire revenir.</p><img data-src="/step(1).jpg" src="placeholder.jpg">
    <p>Ajouter le bouillon.</p><script type="application/ld+json">{"@type":"Recipe"}</script>"""
    text, _ = extract_page_content(html, "https://example.test/recipe")
    assert "Soupe" in text
    assert "Other recipes" not in text
    assert text.index("Faire revenir") < text.index("step%281%29.jpg") < text.index("Ajouter")
    assert "https://example.test/step%281%29.jpg" in text
    assert '"@type":"Recipe"' in text


@pytest.mark.asyncio
async def test_structured_ai_source_keeps_dom_images():
    ctx = SimpleNamespace(resolved_url=None, input=WorkflowInput(url="https://example.test/recipe"))
    html = '<p>Cuire.</p><img src="/step.jpg"><script type="application/ld+json">{"@type":"Recipe"}</script>'
    compiler = StructuredDataCompiler(ctx, html)
    source = await compiler.compile()
    assert "https://example.test/step.jpg" in source.content


def translation_source():
    return OpenAIRecipe(
        name="Rice",
        ingredients=[OpenAIRecipeIngredient(text="1.5 cups rice")],
        instructions=[OpenAIRecipeInstruction(text="Cook 20 minutes.\n\n![](https://example.test/step.jpg)")],
    )


def test_french_translation_preserves_images_and_decimal_quantities():
    source = translation_source()
    translated = source.model_copy(deep=True)
    translated.ingredients[0].text = "1,5 tasses de riz"
    translated.instructions[0].text = "Cuire 20 minutes.\n\n![](https://example.test/step.jpg)"
    TranslateRecipeStep._validate_translation(source, translated)


@pytest.mark.parametrize("change", ["drop-step", "change-image", "change-quantity", "empty-step"])
def test_lossy_translation_is_rejected(change):
    source = translation_source()
    translated = source.model_copy(deep=True)
    if change == "drop-step":
        translated.instructions = []
    elif change == "change-image":
        translated.instructions[0].text = translated.instructions[0].text.replace("step.jpg", "other.jpg")
    elif change == "change-quantity":
        translated.ingredients[0].text = "2 tasses de riz"
    else:
        translated.instructions[0].text = ""
    with pytest.raises(ValueError):
        TranslateRecipeStep._validate_translation(source, translated)


@pytest.mark.asyncio
async def test_partial_scrape_can_recover_missing_steps(monkeypatch):
    partial = Recipe(name="Source", recipe_ingredient=[RecipeIngredient(note="1 oignon")])
    recovered = Recipe(
        name="AI",
        recipe_ingredient=[RecipeIngredient(note="2 oignons")],
        recipe_instructions=[RecipeStep(text="Émincer.")],
    )

    def strategy(recipe):
        class Strategy:
            def __init__(self, *args, **kwargs):
                pass

            def can_scrape(self):
                return True

            async def parse(self, **kwargs):
                return copy.deepcopy(recipe), ScrapedExtras()

        return Strategy

    monkeypatch.setattr(cleaner, "clean", lambda recipe, translator: recipe)
    scraper = RecipeScraper(None, get_locale_provider(), [strategy(partial), strategy(recovered)])
    result, _ = await scraper.scrape("https://example.test/recipe", html="<p>Recipe</p>")
    assert result.name == "Source"
    assert result.recipe_ingredient[0].note == "1 oignon"
    assert result.recipe_instructions[0].text == "Émincer."


@pytest.mark.asyncio
async def test_partial_scrape_is_kept_if_recovery_fails(monkeypatch):
    partial = Recipe(name="Source", recipe_ingredient=[RecipeIngredient(note="1 oignon")])

    class Strategy:
        def __init__(self, *args, **kwargs):
            pass

        def can_scrape(self):
            return True

        parse = AsyncMock(return_value=(partial, ScrapedExtras()))

    monkeypatch.setattr(cleaner, "clean", lambda recipe, translator: recipe)
    result, _ = await RecipeScraper(None, get_locale_provider(), [Strategy]).scrape(
        "https://example.test/recipe", html="<p>Recipe</p>"
    )
    assert result is partial


@pytest.mark.parametrize("html", ["", "<script>tracking()</script>", "<nav>Menu</nav>"])
def test_empty_page_is_not_a_recipe_source(html):
    with pytest.raises(ValueError):
        extract_page_content(html)


def test_placeholder_text_is_not_a_complete_recipe():
    from mealie.services.scraper.recipe_scraper import has_recipe_content

    assert not has_recipe_content("Could not detect instructions")
    assert not has_recipe_content("No Instructions Found")
    assert has_recipe_content("Cuire 20 minutes.")


@pytest.mark.asyncio
async def test_translation_keeps_normalized_servings_and_times():
    original = Recipe(
        name="Rice",
        recipe_yield="servings",
        recipe_yield_quantity=4,
        recipe_servings=4,
        prep_time="5 minutes",
        total_time="25 minutes",
        recipe_ingredient=[RecipeIngredient(note="1.5 cups rice")],
        recipe_instructions=[RecipeStep(text="Cook 20 minutes.\n\n![](https://example.test/step.jpg)")],
    )
    step = TranslateRecipeStep()
    response = step._to_openai_recipe(original)
    assert response.recipe_yield == "4 servings"
    response.name = "Riz"
    response.recipe_yield = "4 portions"
    response.ingredients[0].text = "1,5 tasses de riz"
    response.instructions[0].text = "Cuire 20 minutes.\n\n![](https://example.test/step.jpg)"
    ctx = SimpleNamespace(
        draft_recipe=original,
        input=WorkflowInput(),
        user=None,
        household=None,
        compiled_source=None,
        options=SimpleNamespace(translate_language="French"),
        translator=get_locale_provider("fr-FR"),
        ai=SimpleNamespace(get_prompt=lambda name: name, get_response=AsyncMock(return_value=response)),
    )
    await step.run(ctx)
    assert ctx.draft_recipe.name == "Riz"
    assert ctx.draft_recipe.recipe_servings == 4
    assert ctx.draft_recipe.recipe_yield_quantity == 4
    assert ctx.draft_recipe.total_time == "25 minutes"
    assert ctx.draft_recipe.prep_time == "5 minutes"
    assert "step.jpg" in ctx.draft_recipe.recipe_instructions[0].text


@pytest.mark.parametrize("image", ["//files.example.test/step.jpg", "/photos/step.jpg", "step.jpg"])
def test_relative_step_images_resolve_against_recipe_url(image):
    source = [
        {
            "@type": "HowToSection",
            "name": "Preparation",
            "itemListElement": [
                {"text": "Mix.", "image": image},
            ],
        }
    ]
    result = cleaner.clean_instructions(source, base_url="https://example.test/recipes/pastry.html")
    assert "![](https://" in result[0]["text"]
    assert image.lstrip("/").split("/")[-1] in result[0]["text"]


def test_meilleurduchef_style_recipe_preserves_all_illustrated_steps():
    import json

    from recipe_scrapers import scrape_html

    from mealie.services.scraper.scraper_strategies import RecipeScraperPackage

    source = {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": "Pastry fixture",
        "recipeIngredient": ["500 g flour", "250 g water", "10 g salt", "375 g butter"],
        "recipeInstructions": [
            {
                "@type": "HowToStep",
                "name": f"Pastry - {number}",
                "text": f"Prepare component {number}.",
                "image": f"//files.example.test/pastry/step-{number}.jpg",
            }
            for number in range(1, 65)
        ],
    }
    url = "https://www.meilleurduchef.com/en/recipe/puff-pastry.html"
    data = scrape_html(RecipeScraperPackage.ld_json_to_html(json.dumps(source)), org_url=url, supported_only=False)
    recipe, _ = RecipeScraperPackage(url, get_locale_provider("fr-FR"), None).clean_scraper(data, url)
    recipe = cleaner.clean(recipe, get_locale_provider("fr-FR"))
    assert len(recipe.recipe_ingredient) == 4
    assert len(recipe.recipe_instructions) == 64
    assert all("![](https://files.example.test/" in step.text for step in recipe.recipe_instructions)
