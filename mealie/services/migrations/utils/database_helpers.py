from __future__ import annotations

from collections.abc import Iterable
from typing import TYPE_CHECKING

from pydantic import BaseModel
from slugify import slugify
from sqlalchemy.orm import Session

from mealie.repos.all_repositories import AllRepositories
from mealie.schema.recipe import RecipeCategory
from mealie.schema.recipe.recipe import RecipeTag
from mealie.schema.recipe.recipe_category import CategoryOut, CategorySave, TagOut, TagSave

if TYPE_CHECKING:
    from mealie.repos.repository_generic import RepositoryGeneric


class DatabaseMigrationHelpers:
    def __init__(self, db: AllRepositories, session: Session) -> None:
        self.session = session
        self.db = db

    def _get_or_set_generic[T: BaseModel](
        self, accessor: RepositoryGeneric, items: Iterable[str], create_model: type[T], out_model: type[T]
    ) -> list[T]:
        """
        Recipe migrations may attach existing categories/tags, but never create them.
        """
        items_out = []

        for item_name in items:
            slug_lookup = slugify(item_name)

            item_model = accessor.get_one(value=slug_lookup, key="slug", override_schema=out_model)

            if item_model:
                items_out.append(item_model)
        return items_out

    def get_or_set_category(self, categories: Iterable[str]) -> list[RecipeCategory]:
        return self._get_or_set_generic(
            self.db.categories,
            categories,
            CategorySave,
            CategoryOut,
        )

    def get_or_set_tags(self, tags: Iterable[str]) -> list[RecipeTag]:
        return self._get_or_set_generic(
            self.db.tags,
            tags,
            TagSave,
            TagOut,
        )
