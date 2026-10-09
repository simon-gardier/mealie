<template>
  <div class="cookbook-editor">
    <div v-if="cookbook" class="cookbook-editor-body">
      <section class="cookbook-details">
        <v-text-field
          v-model="cookbook.name"
          :label="$t('cookbook.cookbook-name')"
          variant="outlined"
          hide-details="auto"
          :rules="[value => !!value?.trim() || $t('cookbook.name-required')]"
          color="primary"
        />
        <v-textarea
          v-model="cookbook.description"
          auto-grow
          :rows="2"
          :label="$t('cookbook.optional-description')"
          variant="outlined"
          hide-details="auto"
          color="primary"
        />
      </section>
      <section>
        <h2 class="cookbook-section-title">
          {{ $t('cookbook.filters-title') }}
        </h2>
        <p class="cookbook-hint">
          {{ $t('cookbook.filters-description') }}
        </p>
        <QueryFilterBuilder cookbook-layout :field-defs="fieldDefs" :initial-query-filter="cookbook.queryFilter" @input="handleInput">
          <template #actions="{ addField }">
            <BaseButton
              create
              color="primary"
              height="44"
              variant="tonal"
              :text="$t('cookbook.add-filter')"
              @click="addField"
            />
          </template>
        </QueryFilterBuilder>
        <p v-if="!cookbook.queryFilterString" class="cookbook-hint filter-guidance">
          {{ $t('cookbook.complete-filters') }}
        </p>
      </section>
      <section class="cookbook-sharing">
        <div class="cookbook-sharing-copy">
          <h2 class="cookbook-section-title">
            {{ $t('cookbook.public-cookbook') }}
          </h2>
          <p class="cookbook-hint">
            {{ $t('cookbook.public-cookbook-description') }}
          </p>
        </div>
        <v-switch v-model="cookbook.public" hide-details color="primary" :aria-label="$t('cookbook.public-cookbook')" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends CreateCookBook & { queryFilter?: ReadCookBook['queryFilter'] }">
import { Organizer } from "~/lib/api/types/non-generated";
import QueryFilterBuilder from "~/components/Domain/QueryFilterBuilder.vue";
import type { FieldDefinition } from "~/composables/use-query-filter-builder";
import type { CreateCookBook, ReadCookBook } from "~/lib/api/types/cookbook";

const modelValue = defineModel<T>({ required: true });
defineProps<{ styled?: boolean }>();
const i18n = useI18n();
const cookbook = toRef(modelValue);
function handleInput(value: string | undefined) {
  cookbook.value.queryFilterString = value || "";
}

const fieldDefs: FieldDefinition[] = [
  {
    name: "recipe_category.id",
    label: i18n.t("category.categories"),
    type: Organizer.Category,
  },
  {
    name: "tags.id",
    label: i18n.t("tag.tags"),
    type: Organizer.Tag,
  },
  {
    name: "recipe_ingredient.food.id",
    label: i18n.t("recipe.ingredients"),
    type: Organizer.Food,
  },
  {
    name: "recipe_ingredient.food.label_id",
    label: i18n.t("data-pages.foods.food-label"),
    type: Organizer.Label,
  },
  {
    name: "tools.id",
    label: i18n.t("tool.tools"),
    type: Organizer.Tool,
  },
  {
    name: "household_id",
    label: i18n.t("household.households"),
    type: Organizer.Household,
  },
  {
    name: "user_id",
    label: i18n.t("user.users"),
    type: Organizer.User,
  },
  {
    name: "rating",
    label: i18n.t("general.rating"),
    type: "number",
  },
  {
    name: "created_at",
    label: i18n.t("general.date-created"),
    type: "date",
  },
  {
    name: "updated_at",
    label: i18n.t("general.date-updated"),
    type: "date",
  },
];
</script>

<style scoped>
.cookbook-editor-body {
  display: grid;
  gap: 24px;
  padding: 24px;
  font-family: var(--bistro-body);
}
.cookbook-editor .cookbook-section-title {
  font-family: var(--bistro-body) !important;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: normal;
  margin: 0 0 8px;
}
.cookbook-hint {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
}
.cookbook-details {
  display: grid;
  gap: 16px;
}
.cookbook-sharing {
  display: flex;
  align-items: center;
  gap: 16px;
  border-top: 1px solid rgb(var(--v-theme-separator));
  padding-top: 24px;
}
.cookbook-sharing-copy {
  flex: 1;
  min-width: 0;
}
.cookbook-sharing p,
.filter-guidance {
  margin-bottom: 0;
}
.cookbook-sharing :deep(.v-input) {
  flex: 0 0 auto;
}
.filter-guidance {
  margin-top: 12px;
  font-size: 13px;
}
.cookbook-editor :deep(.v-btn) {
  text-transform: none;
  height: 44px;
  border-radius: 10px;
  box-shadow: none;
}
@media (max-width: 600px) {
  .cookbook-editor-body {
    padding: 16px;
  }
}
</style>
