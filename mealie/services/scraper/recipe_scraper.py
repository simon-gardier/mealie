from collections.abc import Awaitable, Callable

from mealie.core.root_logger import get_logger
from mealie.lang.providers import Translator
from mealie.repos.repository_factory import AllRepositories
from mealie.schema.recipe.recipe import Recipe
from mealie.services.scraper import cleaner
from mealie.services.scraper.scraped_extras import ScrapedExtras

from .scraper_strategies import (
    ABCScraperStrategy,
    RecipeScraperOpenAI,
    RecipeScraperOpenAITranscription,
    RecipeScraperOpenGraph,
    RecipeScraperPackage,
    safe_scrape_html,
)

DEFAULT_SCRAPER_STRATEGIES: list[type[ABCScraperStrategy]] = [
    RecipeScraperPackage,
    RecipeScraperOpenAITranscription,
    RecipeScraperOpenAI,
    RecipeScraperOpenGraph,
]


def has_recipe_content(text: str) -> bool:
    return bool(text.strip()) and text.strip().casefold() not in {
        "could not detect ingredients",
        "could not detect instructions",
        "no instructions found",
    }


class RecipeScraper:
    """
    Scrapes recipes from the web.
    """

    # List of recipe scrapers. Note that order matters
    scrapers: list[type[ABCScraperStrategy]]

    def __init__(
        self, repos: AllRepositories, translator: Translator, scrapers: list[type[ABCScraperStrategy]] | None = None
    ) -> None:
        if scrapers is None:
            scrapers = DEFAULT_SCRAPER_STRATEGIES

        self.scrapers = scrapers
        self.repos = repos
        self.translator = translator
        self.logger = get_logger()

    async def scrape(
        self,
        url: str,
        html: str | None = None,
        on_progress: Callable[[str], Awaitable[None]] | None = None,
        include_tags: bool = False,
        include_categories: bool = False,
    ) -> tuple[Recipe, ScrapedExtras] | tuple[None, None]:
        """
        Scrapes a recipe from the web.
        Skips the network request if `html` is provided.
        Optionally reports progress back via `on_progress`.

        `include_tags` and `include_categories` tell strategies whether the caller intends to use
        organizers, so that strategies which have to ask a provider for them can skip the request.
        """

        if not html:
            if on_progress:
                await on_progress(self.translator.t("recipe.create-progress.fetching-webpage"))

            html = await safe_scrape_html(url)
            if not html:
                return None, None

        partial: tuple[Recipe, ScrapedExtras] | None = None
        for ScraperClass in self.scrapers:
            scraper = ScraperClass(
                url,
                self.translator,
                self.repos,
                raw_html=html,
                include_tags=include_tags,
                include_categories=include_categories,
            )
            if not scraper.can_scrape():
                self.logger.debug(f"Skipping {scraper.__class__.__name__}")
                continue

            try:
                result = await scraper.parse(on_progress=on_progress)
            except Exception:
                self.logger.exception(f"Failed to scrape HTML with {scraper.__class__.__name__}")
                result = None

            if result is None or result[0] is None:
                continue

            recipe_result, extras = result
            try:
                recipe = cleaner.clean(recipe_result, self.translator)
            except Exception:
                self.logger.exception(f"Failed to clean recipe data from {scraper.__class__.__name__}")
                continue

            has_ingredients = any(has_recipe_content(ingredient.display) for ingredient in recipe.recipe_ingredient)
            has_instructions = any(has_recipe_content(step.text) for step in recipe.recipe_instructions or [])
            if not (has_ingredients and has_instructions):
                if partial is None:
                    partial = recipe, extras
                continue

            if partial is not None:
                original, original_extras = partial
                # Keep usable source sections; AI only supplies the missing section.
                if any(has_recipe_content(ingredient.display) for ingredient in original.recipe_ingredient):
                    recipe.recipe_ingredient = original.recipe_ingredient
                if any(has_recipe_content(step.text) for step in original.recipe_instructions or []):
                    recipe.recipe_instructions = original.recipe_instructions
                for field in (
                    "name",
                    "description",
                    "recipe_yield",
                    "recipe_servings",
                    "recipe_yield_quantity",
                    "prep_time",
                    "perform_time",
                    "total_time",
                    "nutrition",
                    "image",
                ):
                    value = getattr(original, field)
                    if value and value != "no image":
                        setattr(recipe, field, value)
                extras = original_extras
            return recipe, extras

        return partial or (None, None)
