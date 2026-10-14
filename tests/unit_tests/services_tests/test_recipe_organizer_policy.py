from types import SimpleNamespace
from unittest.mock import Mock
from uuid import uuid4

import pytest

from mealie.services.migrations.utils.database_helpers import DatabaseMigrationHelpers
from mealie.services.recipe.recipe_service import RecipeService
from mealie.services.scraper.scraped_extras import ScrapedExtras, ScraperContext


@pytest.mark.parametrize("kind", ["tags", "categories"])
def test_scraped_organizers_only_use_existing_records(kind):
    existing = SimpleNamespace(name="Desserts", id=uuid4())
    repo = Mock()
    repo.get_one.side_effect = lambda name, key: existing if name == "desserts" else None
    ctx = ScraperContext(SimpleNamespace(**{kind: repo}, group_id=uuid4()))
    extras = ScrapedExtras()
    getattr(extras, f"set_{kind}")(["Desserts", "New organizer", "Desserts"])
    assert getattr(extras, f"use_{kind}")(ctx) == [existing]
    repo.create.assert_not_called()


def test_tool_creation_is_still_allowed():
    repo = Mock()
    repo.get_one.return_value = None
    tool = SimpleNamespace(id=uuid4(), name="Mixer")
    repo.create.return_value = tool
    extras = ScrapedExtras()
    extras.set_tools(["Mixer"])
    ctx = ScraperContext(SimpleNamespace(tools=repo, group_id=uuid4()))
    assert extras.use_tools(ctx) == [tool]
    repo.create.assert_called_once()


def test_zip_normalization_drops_unknown_organizers():
    repo = Mock()
    repo.get_one.return_value = None
    assert RecipeService._transform_category_or_tag(None, {"name": "New tag"}, repo) is None
    repo.create.assert_not_called()


def test_zip_normalization_matches_an_existing_name_without_a_slug():
    repo = Mock()
    repo.get_one.return_value.model_dump.return_value = {"id": "existing", "name": "Dessert"}
    result = RecipeService._transform_category_or_tag(None, {"name": "Dessert"}, repo)
    assert result["id"] == "existing"
    repo.create.assert_not_called()


def test_migration_imports_cannot_create_organizers():
    repo = Mock()
    repo.get_one.return_value = None
    helper = DatabaseMigrationHelpers(SimpleNamespace(group_id=uuid4(), tags=repo), None)
    assert helper.get_or_set_tags(["New tag"]) == []
    repo.create.assert_not_called()
