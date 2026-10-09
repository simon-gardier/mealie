<template>
  <div class="meal-rule-form">
    <div
      class="meal-rule-scope"
    >
      <v-select
        v-model="day"
        :items="MEAL_DAY_OPTIONS"
        :label="$t('meal-plan.rule-day')"
      />
      <v-select
        v-model="entryType"
        :items="MEAL_TYPE_OPTIONS"
        :label="$t('meal-plan.meal-type')"
      />
    </div>

    <div>
      <QueryFilterBuilder
        class="meal-rule-editor"
        cookbook-layout
        :field-defs="fieldDefs"
        :initial-query-filter="props.queryFilter"
        @input="handleQueryFilterInput"
      />
    </div>

    <p class="meal-rule-summary">
      {{ $t("meal-plan.this-rule-will-apply", {
        dayCriteria: day === "unset"
          ? $t("meal-plan.to-all-days")
          : $t("meal-plan.on-days", [$t("general." + day)]),
        mealTypeCriteria: entryType === "unset"
          ? $t("meal-plan.for-all-meal-types")
          : $t("meal-plan.for-type-meal-types", [$t("meal-plan." + entryType)]),
      }) }}
    </p>
  </div>
</template>

<script setup lang="ts">
import QueryFilterBuilder from "~/components/Domain/QueryFilterBuilder.vue";
import type { FieldDefinition } from "~/composables/use-query-filter-builder";
import { Organizer } from "~/lib/api/types/non-generated";
import type { QueryFilterJSON } from "~/lib/api/types/non-generated";

interface Props {
  queryFilter?: QueryFilterJSON | null;
  showHelp?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  queryFilter: null,
  showHelp: false,
});

const day = defineModel<string>("day", { default: "unset" });
const entryType = defineModel<string>("entryType", { default: "unset" });
const queryFilterString = defineModel<string>("queryFilterString", { default: "" });

const i18n = useI18n();

const MEAL_TYPE_OPTIONS = [
  { title: i18n.t("meal-plan.breakfast"), value: "breakfast" },
  { title: i18n.t("meal-plan.lunch"), value: "lunch" },
  { title: i18n.t("meal-plan.dinner"), value: "dinner" },
  { title: i18n.t("meal-plan.side"), value: "side" },
  { title: i18n.t("meal-plan.snack"), value: "snack" },
  { title: i18n.t("meal-plan.drink"), value: "drink" },
  { title: i18n.t("meal-plan.dessert"), value: "dessert" },
  { title: i18n.t("meal-plan.type-any"), value: "unset" },
];

const MEAL_DAY_OPTIONS = [
  { title: i18n.t("general.monday"), value: "monday" },
  { title: i18n.t("general.tuesday"), value: "tuesday" },
  { title: i18n.t("general.wednesday"), value: "wednesday" },
  { title: i18n.t("general.thursday"), value: "thursday" },
  { title: i18n.t("general.friday"), value: "friday" },
  { title: i18n.t("general.saturday"), value: "saturday" },
  { title: i18n.t("general.sunday"), value: "sunday" },
  { title: i18n.t("meal-plan.day-any"), value: "unset" },
];

function handleQueryFilterInput(value: string | undefined) {
  queryFilterString.value = value || "";
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
    name: "last_made",
    label: i18n.t("general.last-made"),
    type: "relativeDate",
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
.meal-rule-form {
  display: grid;
  gap: 24px;
}
.meal-rule-scope {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.meal-rule-editor {
  padding: 24px;
}
.meal-rule-summary {
  margin: 0;
  color: rgb(var(--v-theme-text-secondary));
  font-size: 14px;
}
@media (max-width: 600px) {
  .meal-rule-editor {
    padding: 16px;
  }
  .meal-rule-scope {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
