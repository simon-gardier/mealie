import re
from collections import Counter

from mealie.core.root_logger import get_logger
from mealie.schema.openai.recipe import (
    OpenAIRecipe,
    OpenAIRecipeIngredient,
    OpenAIRecipeInstruction,
    OpenAIRecipeNotes,
)
from mealie.schema.recipe.recipe import Recipe
from mealie.services.scraper import cleaner

from ..base import WorkflowStep
from ..context import WorkflowContext
from ..recipe_conversion import to_recipe

TRANSLATE_RECIPE_PROMPT = "recipes.translate-recipe"

logger = get_logger()


class TranslateRecipeStep(WorkflowStep):
    """
    Translates the draft recipe into the language the caller asked for.

    Translating is its own request rather than a clause bolted onto the build prompt, so that
    neither prompt has to hedge about the other and the recipe being translated is already
    structured: the provider is handed discrete fields to translate instead of being asked to
    extract and translate in one pass.

    The step is optional. A translation that fails leaves an untranslated recipe behind, which
    is worth more to the user than discarding an import that otherwise succeeded.
    """

    name = "translate-recipe"
    progress_key = "recipe.create-progress.translating-recipe"
    required = False

    def should_run(self, ctx: WorkflowContext) -> bool:
        language = ctx.options.translate_language
        if not (language and ctx.draft_recipe):
            return False

        # nothing to do when the source is already written in the target language
        source_language = ctx.compiled_source.language if ctx.compiled_source else None
        return language.lower() != (source_language or "").lower()

    @staticmethod
    def _to_openai_recipe(recipe: Recipe) -> OpenAIRecipe:
        """
        Puts the draft recipe back into the provider's own schema.

        Sending the recipe in the shape it has to come back in is what keeps the translation
        aligned field by field. Nutrition is left out: by this point it holds bare numbers with
        fixed units, so there is nothing in it to translate.
        """

        return OpenAIRecipe(
            name=recipe.name or "",
            description=recipe.description,
            recipe_yield=recipe.recipe_yield_display or None,
            total_time=recipe.total_time,
            prep_time=recipe.prep_time,
            perform_time=recipe.perform_time,
            ingredients=[
                OpenAIRecipeIngredient(title=ingredient.title, text=ingredient.display)
                for ingredient in recipe.recipe_ingredient
                if ingredient.display
            ],
            instructions=[
                OpenAIRecipeInstruction(title=step.title, text=step.text)
                for step in recipe.recipe_instructions or []
                if step.text
            ],
            notes=[OpenAIRecipeNotes(title=note.title, text=note.text) for note in recipe.notes or [] if note.text],
        )

    def _build_message(self, ctx: WorkflowContext, recipe: Recipe) -> str:
        translatable = self._to_openai_recipe(recipe)

        return "\n\n".join(
            [
                f"Translate the recipe below into {ctx.options.translate_language}.",
                translatable.model_dump_json(exclude_none=True),
            ]
        )

    @staticmethod
    def _validate_translation(original: OpenAIRecipe, translated: OpenAIRecipe) -> None:
        """Reject lossy translations before they replace the source recipe."""
        for field in ("ingredients", "instructions", "notes"):
            before = getattr(original, field)
            after = getattr(translated, field)
            if len(before) != len(after):
                raise ValueError(f"Translation changed the number of {field}")
            for source, result in zip(before, after, strict=True):
                if source.text.strip() and not result.text.strip():
                    raise ValueError(f"Translation removed text from {field}")
                # Markdown destinations are source evidence, not translatable prose.
                links = r"!?\[[^\]]*\]\(([^\n]+?)\)"
                if re.findall(links, source.text) != re.findall(links, result.text):
                    raise ValueError(f"Translation changed image or link URLs in {field}")
                # Ignore URL digits; decimal punctuation may change with the language.
                source_text = re.sub(links, "", source.text)
                result_text = re.sub(links, "", result.text)
                numbers = r"\d+(?:[.,]\d+)?"
                source_numbers = Counter(value.replace(",", ".") for value in re.findall(numbers, source_text))
                result_numbers = Counter(value.replace(",", ".") for value in re.findall(numbers, result_text))
                if source_numbers != result_numbers:
                    raise ValueError(f"Translation changed quantities or temperatures in {field}")
                if source.title and not result.title:
                    raise ValueError(f"Translation removed a section heading from {field}")

    async def run(self, ctx: WorkflowContext) -> None:
        recipe = ctx.draft_recipe
        if not recipe:
            return

        response = await ctx.ai.get_response(
            ctx.ai.get_prompt(TRANSLATE_RECIPE_PROMPT),
            self._build_message(ctx, recipe),
            response_schema=OpenAIRecipe,
        )

        if not (response and (response.ingredients or response.instructions)):
            # a translation that came back empty would lose the recipe, so keep the original
            logger.error("Translation returned no recipe, keeping the untranslated one")
            return

        self._validate_translation(self._to_openai_recipe(recipe), response)
        translated = to_recipe(ctx, response)
        # nutrition never made the round trip, so it carries over untouched
        translated.nutrition = recipe.nutrition

        # cleaning again is what parses the translated times and yield back out of their new wording
        translated = cleaner.clean(translated, ctx.translator)
        for field in ("prep_time", "perform_time", "total_time", "recipe_servings", "recipe_yield_quantity"):
            setattr(translated, field, getattr(recipe, field))
        ctx.draft_recipe = translated
