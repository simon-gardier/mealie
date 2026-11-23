<template>
  <v-row class="planner-grid">
    <!-- weeks span the full grid row, so each week's days start on a new row below it -->
    <v-col
      v-for="(plan, index) in mealplans"
      :key="index"
      class="col-borders my-1 d-flex flex-column"
      :class="{ 'week-section': plan.endDate }"
    >
      <slot v-bind="{ plan, index, day: getDay(plan) }" />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import type { PlanEntryType } from "~/lib/api/types/meal-plan";

defineProps<{
  mealplans: MealsByDate[];
}>();
const planTypeOptions = usePlanTypeOptions();

function getDay(day: MealsByDate): Days {
  const forSection = (key: PlanEntryType) => day.meals.filter(({ entryType }) => entryType === key);
  return {
    date: day.date,
    endDate: day.endDate,
    sections: planTypeOptions
      .map(({ text, value }) => ({ title: text, meals: forSection(value) }))
      .filter(({ meals }) => meals.length > 0),
    recipes: getScaledRecipes(day.meals),
  };
}
</script>

<style scoped>
/* a light tint of the week header's color, so the whole week reads as one block apart from the days */
.week-section {
  grid-column: 1 / -1;
  background-color: rgba(var(--v-theme-primary), 0.08);
  border-radius: 4px;
}

/* a week spans the full row, so its meals are laid out side by side instead of in one long column */
:deep(.week-meals) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  column-gap: 8px;
}
</style>
