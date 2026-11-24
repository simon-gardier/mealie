from collections.abc import Awaitable, Callable

from mealie.core.root_logger import get_logger
from mealie.lang.providers import Translator
from mealie.pkgs.safehttp import fetch_via_flaresolverr, resilient_fetch
from mealie.repos.repository_factory import AllRepositories
from mealie.schema.recipe.recipe import RecipeDraft
from mealie.services.openai import OpenAIService
from mealie.services.recipe.import_workflow import (
    ENRICHMENT_WORKFLOW_STEPS,
    RecipeImportWorkflow,
    WorkflowContext,
    WorkflowInput,
    WorkflowOptions,
)
from mealie.services.scraper import cleaner
from mealie.services.scraper.scraped_extras import ScrapedExtras

from .scraper_strategies import (
    ABCScraperStrategy,
    RecipeScraperOpenAI,
    RecipeScraperOpenAITranscription,
    RecipeScraperOpenGraph,
    RecipeScraperPackage,
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
    ) -> tuple[RecipeDraft, ScrapedExtras] | tuple[None, None]:
        """
        Scrapes a recipe from the web.
        Skips the network request if `html` is provided.
        Optionally reports progress back via `on_progress`.

        `include_tags` and `include_categories` tell strategies whether the caller intends to use
        organizers, so that strategies which have to ask a provider for them can skip the request.
        """

        resolved_url: str | None = None
        can_escalate = False
        if not html:
            if on_progress:
                await on_progress(self.translator.t("recipe.create-progress.fetching-webpage"))

            fetched = await resilient_fetch(url)
            if not fetched or not fetched.text:
                return None, None
            html = fetched.text
            resolved_url = fetched.url
            can_escalate = not fetched.via_flaresolverr

        # A source page can yield a recipe missing its ingredients or steps. Keep it as a partial
        # result across every pass so a later strategy (e.g. AI) only supplies the missing section.
        partial: tuple[RecipeDraft, ScrapedExtras] | None = None

        async def run(
            strategies: list[type[ABCScraperStrategy]], page_html: str, page_url: str | None
        ) -> tuple[RecipeDraft, ScrapedExtras] | None:
            nonlocal partial
            complete, partial = await self._scrape_with_strategies(
                strategies,
                url,
                page_html,
                page_url,
                partial,
                on_progress=on_progress,
                include_tags=include_tags,
                include_categories=include_categories,
            )
            return complete

        primary = [scraper for scraper in self.scrapers if not scraper.is_fallback]
        fallbacks = [scraper for scraper in self.scrapers if scraper.is_fallback]

        result = await run(primary, html, resolved_url)
        if result is not None:
            return result

        # A page with no recipe is often a JavaScript bot wall served with a 200 status, which the
        # fetch-level challenge detection cannot recognize. FlareSolverr drives a real browser, so
        # retry through it before the fallback strategies accept the bot wall as a recipe.
        if can_escalate:
            solved = await fetch_via_flaresolverr(url)
            if solved is not None and solved.text and solved.text != html:
                html, resolved_url = solved.text, solved.url
                result = await run(primary, html, resolved_url)
                if result is not None:
                    return result

        result = await run(fallbacks, html, resolved_url)
        if result is not None:
            return result

        return partial or (None, None)

    async def _scrape_with_strategies(
        self,
        strategies: list[type[ABCScraperStrategy]],
        url: str,
        html: str,
        resolved_url: str | None,
        partial: tuple[RecipeDraft, ScrapedExtras] | None = None,
        on_progress: Callable[[str], Awaitable[None]] | None = None,
        include_tags: bool = False,
        include_categories: bool = False,
    ) -> tuple[tuple[RecipeDraft, ScrapedExtras] | None, tuple[RecipeDraft, ScrapedExtras] | None]:
        """Returns the first complete recipe (or None) and the partial recipe kept so far."""

        for ScraperClass in strategies:
            scraper = ScraperClass(
                url,
                self.translator,
                self.repos,
                raw_html=html,
                include_tags=include_tags,
                include_categories=include_categories,
                resolved_url=resolved_url,
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

            # a recipe the AI already completed isn't enriched a second time
            if not ScraperClass.uses_ai and self._should_enrich():
                await self._enrich(
                    recipe,
                    extras,
                    url,
                    resolved_url,
                    on_progress=on_progress,
                    resolve_organizers=include_tags or include_categories,
                )

            return (recipe, extras), partial

        return None, partial

    def _should_enrich(self) -> bool:
        group_id = self.repos.scoped_group_id
        settings = self.repos.group_ai_provider_settings.get_one(group_id) if group_id else None
        return bool(settings and settings.enrich_non_ai_imports_enabled)

    async def _enrich(
        self,
        recipe: RecipeDraft,
        extras: ScrapedExtras,
        url: str,
        resolved_url: str | None,
        on_progress: Callable[[str], Awaitable[None]] | None = None,
        resolve_organizers: bool = False,
    ) -> None:
        """
        Runs the import workflow's enrichment steps over a recipe that was scraped without AI.

        The recipe is refined in place. Organizers are reported back through `extras`, replacing
        any the page declared, so the caller applies them the same way as with every other strategy.
        """

        ctx = WorkflowContext(
            input=WorkflowInput(url=url),
            resolved_url=resolved_url,
            options=WorkflowOptions(resolve_organizers=resolve_organizers, attach_organizers=False),
            repos=self.repos,
            translator=self.translator,
            ai=OpenAIService(self.repos),
            on_progress=on_progress,
            draft_recipe=recipe,
        )

        try:
            await RecipeImportWorkflow(ENRICHMENT_WORKFLOW_STEPS).run(ctx)
        except Exception:
            # an unenriched recipe is still a successful import
            self.logger.exception("Failed to enrich scraped recipe, keeping it as scraped")
            return

        if not ctx.organizer_names:
            return

        if tags := cleaner.clean_tags(ctx.organizer_names.tags):
            extras.set_tags(tags)
        if categories := cleaner.clean_categories(ctx.organizer_names.categories):
            extras.set_categories(categories)
