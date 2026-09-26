<template>
  <div :class="{ 'cookbook-editor--styled': props.styled }">
    <v-card-text v-if="cookbook" :class="{ 'cookbook-editor-body': props.styled }">
      <v-text-field v-model="cookbook.name" :label="$t('cookbook.cookbook-name')"
        :variant="props.styled ? 'solo' : 'underlined'" color="primary" :class="{ 'settings-input': props.styled }" />
      <v-textarea v-model="cookbook.description" auto-grow :rows="2" :label="$t('recipe.description')"
        :variant="props.styled ? 'solo' : 'underlined'" color="primary" :class="{ 'settings-input': props.styled }" />
      <QueryFilterBuilder :field-defs="fieldDefs" :initial-query-filter="cookbook.queryFilter" @input="handleInput">
        <template #actions="{ addField }">
          <v-switch v-model="cookbook.public" hide-details single-line color="primary">
            <template #label>
              {{ $t('cookbook.public-cookbook') }}
              <HelpIcon size="small" right class="ml-2">
                {{ $t('cookbook.public-cookbook-description') }}
              </HelpIcon>
            </template>
          </v-switch>
          <v-spacer />
          <BaseButton create :text="$t('general.add-field')" class="my-auto ml-4" @click="addField" />
        </template>
      </QueryFilterBuilder>
    </v-card-text>
  </div>
</template>

<script setup lang="ts">
import { Organizer } from "~/lib/api/types/non-generated";
import QueryFilterBuilder from "~/components/Domain/QueryFilterBuilder.vue";
import type { FieldDefinition } from "~/composables/use-query-filter-builder";
import type { ReadCookBook } from "~/lib/api/types/cookbook";

const modelValue = defineModel<ReadCookBook>({ required: true });
const props = defineProps<{ styled?: boolean }>();
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
.cookbook-editor--styled {
  border-radius: 12px;
  overflow: hidden;
}

.cookbook-editor-body {
  padding: 1rem;
}

.settings-input :deep(.v-field),
.cookbook-editor--styled :deep(.v-field) {
  background: rgba(var(--v-theme-surface), 0.72) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.5);
  border-radius: 10px;
  box-shadow: none !important;
}

.settings-input :deep(.v-field__outline),
.cookbook-editor--styled :deep(.v-field__outline) {
  display: none;
}

.settings-input :deep(.v-field__input),
.cookbook-editor--styled :deep(.v-field__input) {
  padding-left: 1rem;
}
</style>
