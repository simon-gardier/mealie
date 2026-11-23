<template>
  <v-container class="planner-page">
    <RecipeDialogAddToShoppingList
      v-if="shoppingLists"
      v-model="shoppingListDialog"
      :recipes="weekRecipesWithScales"
      :shopping-lists="shoppingLists"
      @list-created="addShoppingList"
    />
    <GroupMealPlanCalendarDialog v-model="calendarDialog" />
    <div class="planner-title-image">
      <v-img src="/menus.png" :alt="$t('meal-plan.dinner-this-week')" max-width="360" />
    </div>
    <div class="planner-toolbar">
      <div class="planner-date-nav">
        <v-btn :icon="$globals.icons.chevronLeft" variant="text" density="comfortable" @click="() => changeWeek(-1)" />
        <v-menu
          v-model="state.picker"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template #activator="{ props }">
            <v-btn color="primary" class="planner-date-nav__range" v-bind="props">
              <v-icon start>
                {{ $globals.icons.calendar }}
              </v-icon>
              {{ $d(visibleRange.start, "short") }} - {{ $d(visibleRange.end, "short") }}
            </v-btn>
          </template>

          <v-card>
            <MealPlanDatePicker
              v-model="state.range"
              hide-header
              :multiple="'range'"
              :first-day-of-week="firstDayOfWeek"
              :local="$i18n.locale"
            />

            <template v-if="isDaysMode">
              <v-card-text>
                <v-number-input
                  v-model="numberOfDaysPast"
                  :min="0"
                  inset
                  :label="$t('meal-plan.numberOfDaysPast-label')"
                  :hint="$t('meal-plan.numberOfDaysPast-hint')"
                  persistent-hint
                />
              </v-card-text>

              <v-card-text>
                <v-number-input
                  v-model="numberOfDays"
                  :min="1"
                  inset
                  :label="$t('meal-plan.numberOfDays-label')"
                  :hint="$t('meal-plan.numberOfDays-hint')"
                  persistent-hint
                />
              </v-card-text>
            </template>
            <template v-else>
              <v-card-text>
                <v-number-input
                  v-model="numberOfWeeksPast"
                  :min="0"
                  inset
                  :label="$t('meal-plan.numberOfWeeksPast-label')"
                  :hint="$t('meal-plan.numberOfWeeksPast-hint')"
                  persistent-hint
                />
              </v-card-text>

              <v-card-text>
                <v-number-input
                  v-model="numberOfWeeks"
                  :min="1"
                  inset
                  :label="$t('meal-plan.numberOfWeeks-label')"
                  :hint="$t('meal-plan.numberOfWeeks-hint')"
                  persistent-hint
                />
              </v-card-text>
            </template>
          </v-card>
        </v-menu>
        <v-btn :icon="$globals.icons.chevronRight" variant="text" density="comfortable" @click="() => changeWeek(1)" />
      </div>
      <v-btn-toggle
        v-model="mealPlanPreferences.mode"
        mandatory
        divided
        variant="outlined"
        color="primary"
        density="comfortable"
      >
        <v-btn value="weeks">
          <v-badge
            :model-value="hiddenWeekMealCount > 0"
            :content="hiddenWeekMealCount"
            color="primary"
            inline
          >
            <span :class="{ 'me-1': hiddenWeekMealCount > 0 }">{{ $t("meal-plan.weeks") }}</span>
          </v-badge>
          <v-tooltip v-if="hiddenWeekMealCount > 0" activator="parent" location="bottom">
            {{ $t("meal-plan.week-meals-hidden", hiddenWeekMealCount) }}
          </v-tooltip>
        </v-btn>
        <v-btn value="days">
          {{ $t("meal-plan.days") }}
        </v-btn>
      </v-btn-toggle>
    </div>
    <div class="planner-content">
      <NuxtPage :mealplans="plans" :actions="actions" :loading="loading" />
    </div>

    <div class="planner-bottom-actions">
      <BaseButton
        color="primary"
        :icon="$globals.icons.cartCheck"
        :text="$t('meal-plan.add-to-shopping-list')"
        :disabled="!hasRecipes"
        @click="addAllToList"
      />
      <v-btn
        :icon="$globals.icons.calendar"
        variant="text"
        :aria-label="$t('meal-plan.calendar-feed')"
        :title="$t('meal-plan.calendar-feed')"
        @click="calendarDialog = true"
      />
      <v-btn
        :icon="$globals.icons.cog"
        variant="text"
        :aria-label="$t('general.settings')"
        :title="$t('general.settings')"
        @click="router.push('/household/mealplan/settings')"
      />
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { addDays, addWeeks, differenceInCalendarDays, format, isSameDay, isValid, parseISO } from "date-fns";
import GroupMealPlanCalendarDialog from "~/components/Domain/Household/GroupMealPlanCalendarDialog.vue";
import RecipeDialogAddToShoppingList from "~/components/Domain/Recipe/RecipeDialogAddToShoppingList.vue";
import { useAddToShoppingListDialog } from "~/composables/shopping-list-page/use-add-to-shopping-list-dialog";
import type { MealsByDate } from "~/composables/use-group-mealplan";
import { getScaledRecipes, getWeekRange, useMealplans } from "~/composables/use-group-mealplan";
import { useHouseholdSelf } from "~/composables/use-households";
import { useUserMealPlanPreferences } from "~/composables/use-users/preferences";

definePageMeta({
  middleware: ["auth"],
});

const TABS = {
  view: "household-mealplan-planner-view",
};

const route = useRoute();
const router = useRouter();
const i18n = useI18n();
const { household, actions: householdActions } = useHouseholdSelf();
const { shoppingLists, open: shoppingListDialog, addAllToList, addShoppingList } = useAddToShoppingListDialog();
const calendarDialog = ref(false);

useSeoMeta({
  title: i18n.t("meal-plan.dinner-this-week"),
});

// useHouseholdSelf() caches data in a module-level singleton for the lifetime of the tab,
// so revisiting this page via client-side navigation can otherwise use a stale
// firstDayOfWeek value if household preferences were changed elsewhere (e.g. Admin
// Households panel) in the same session. Force a revalidation whenever this page is entered.
onMounted(() => {
  householdActions.refresh();
});

const mealPlanPreferences = useUserMealPlanPreferences();
const isDaysMode = computed(() => mealPlanPreferences.value.mode === "days");
const numberOfDaysPast = ref<number>(mealPlanPreferences.value.numberOfDaysPast || 0);
const numberOfDays = ref<number>(mealPlanPreferences.value.numberOfDays || 7);
watch(numberOfDaysPast, (val) => {
  mealPlanPreferences.value.numberOfDaysPast = Number(val);
});
watch(numberOfDays, (val) => {
  mealPlanPreferences.value.numberOfDays = Number(val);
});
const numberOfWeeksPast = ref<number>(mealPlanPreferences.value.numberOfWeeksPast || 0);
const numberOfWeeks = ref<number>(mealPlanPreferences.value.numberOfWeeks || 1);
watch(numberOfWeeksPast, (val) => {
  mealPlanPreferences.value.numberOfWeeksPast = Number(val);
});
watch(numberOfWeeks, (val) => {
  mealPlanPreferences.value.numberOfWeeks = Number(val);
});

// Force to /view if current route is /planner
if (route.path === "/household/mealplan/planner") {
  router.push({
    name: TABS.view,
    query: route.query,
  });
}

function safeParseISO(date: string, fallback: Date | undefined = undefined) {
  try {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : fallback;
  }
  catch {
    return fallback;
  }
}

// In weeks mode these are a day in the first and last week of the default range; `visibleRange` rounds them out to whole weeks
function defaultStartDate() {
  return isDaysMode.value
    ? addDays(new Date(), -numberOfDaysPast.value)
    : addWeeks(new Date(), -numberOfWeeksPast.value);
}

function defaultEndDate() {
  return isDaysMode.value
    ? addDays(new Date(), numberOfDays.value - 1)
    : addWeeks(new Date(), numberOfWeeks.value - 1);
}

// Initialize dates from query parameters or defaults
const initialStartDate = safeParseISO(route.query.start as string, defaultStartDate());
const initialEndDate = safeParseISO(route.query.end as string, defaultEndDate());

const state = ref({
  range: [initialStartDate, initialEndDate] as [Date, Date],
  start: initialStartDate,
  picker: false,
  end: initialEndDate,
});

const firstDayOfWeek = computed(() => {
  return household.value?.preferences?.firstDayOfWeek || 1;
});

function changeWeek(step: number) {
  const { start, end } = visibleRange.value;
  const stepSize = differenceInCalendarDays(end, start) + 1;
  state.value.range = [
    addDays(start, step * stepSize),
    addDays(end, step * stepSize),
  ];
}

watch(isDaysMode, () => {
  state.value.range = [defaultStartDate(), defaultEndDate()];
});

// In weeks mode the planner shows whole weeks, so the selected range is rounded out to the weeks it touches
const visibleRange = computed(() => {
  const sorted = [...state.value.range].sort((a, b) => a.getTime() - b.getTime());

  const start = sorted[0] ?? defaultStartDate();
  const end = sorted[sorted.length - 1] ?? defaultEndDate();

  if (isDaysMode.value) {
    return { start, end };
  }

  return {
    start: getWeekRange(start, firstDayOfWeek.value).start,
    end: getWeekRange(end, firstDayOfWeek.value).end,
  };
});

// Once a range is fully picked, show the whole weeks in the picker too. A half-picked range (one date)
// is left alone, so the picker can still take the second click.
watch(visibleRange, ({ start, end }) => {
  if (isDaysMode.value) return;

  const [first, last] = state.value.range;
  if (state.value.range.length === 2 && !(first && last && isSameDay(first, start) && isSameDay(last, end))) {
    state.value.range = [start, end];
  }
});

// Update query parameters when date range changes
watch(visibleRange, (newRange) => {
  // Keep current route name and params, just update the query
  router.replace({
    name: route.name || TABS.view,
    params: route.params,
    query: {
      ...route.query,
      start: format(newRange.start, "yyyy-MM-dd"),
      end: format(newRange.end, "yyyy-MM-dd"),
    },
  });
}, { immediate: true });

const { mealplans, actions, loading } = useMealplans(visibleRange);

function filterMealByDate(date: Date) {
  if (!mealplans.value) return [];
  return mealplans.value.filter((meal) => {
    // week entries aren't planned for a specific day
    if (meal.endDate) return false;

    const mealDate = parseISO(meal.date);
    return isSameDay(mealDate, date);
  });
}

const days = computed(() => {
  const numDays
    = Math.floor((visibleRange.value.end.getTime() - visibleRange.value.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Calculate absolute value
  if (numDays < 0) return [];

  return Array.from(Array(numDays).keys()).map(
    (i) => {
      const date = new Date(visibleRange.value.start.getTime());
      date.setDate(date.getDate() + i);
      return date;
    },
  );
});

const mealsByDate = computed(() => {
  return days.value.map((day) => {
    return { date: day, meals: filterMealByDate(day) };
  });
});

/**
 * The visible days grouped by week, each with that week's entries, so meals can be planned for any visible week.
 * Week entries are grouped by their own dates rather than the current weeks, so they still show up (as a week
 * without days) if the household's first day of the week has changed since they were planned.
 */
const mealsByWeek = computed(() => {
  const weeks = new Map<string, { week: MealsByDate; days: MealsByDate[] }>();
  const getWeek = (start: Date, end: Date) => {
    const key = format(start, "yyyy-MM-dd");
    if (!weeks.has(key)) {
      weeks.set(key, { week: { date: start, endDate: end, meals: [] }, days: [] });
    }
    return weeks.get(key)!;
  };

  for (const day of mealsByDate.value) {
    const { start, end } = getWeekRange(day.date, firstDayOfWeek.value);
    getWeek(start, end).days.push(day);
  }

  for (const meal of mealplans.value ?? []) {
    if (meal.endDate) {
      getWeek(parseISO(meal.date), parseISO(meal.endDate)).week.meals.push(meal);
    }
  }

  return [...weeks.values()].sort((a, b) => a.week.date.getTime() - b.week.date.getTime());
});

/** Each week followed by its days, the order the planner pages lay them out in. Days mode leaves out the weeks. */
const plans = computed(() => isDaysMode.value
  ? mealsByDate.value
  : mealsByWeek.value.flatMap(({ week, days }) => [week, ...days]));

const hiddenWeekMealCount = computed(() => isDaysMode.value
  ? (mealplans.value ?? []).filter(meal => meal.endDate).length
  : 0);

const allMeals = computed(() => plans.value.flatMap(({ meals }) => meals));

const hasRecipes = computed(() => {
  return allMeals.value.some(meal => meal.recipe);
});

const weekRecipesWithScales = computed(() => {
  return getScaledRecipes(allMeals.value);
});
</script>

<style scoped>
.planner-page {
  max-width: 1480px;
  padding-top: 1.5rem;
}

.planner-title-image {
  display: flex;
  justify-content: center;
  margin-bottom: 0.4rem;
}

/* the range and the weeks/days switch stay centred together, and wrap on narrow screens */
.planner-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem 1rem;
  margin: 0.5rem 0 1.25rem;
}

.planner-date-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-width: 0;
}

/* a long range wraps inside its button instead of pushing the arrows away */
.planner-date-nav__range {
  min-width: min(100%, 300px);
  flex-shrink: 1;
  height: auto;
  min-height: var(--v-btn-height);
  padding-block: 0.25em;
}

.planner-date-nav__range :deep(.v-btn__content) {
  white-space: normal;
}

.planner-content {
  position: relative;
}

.planner-bottom-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1.25rem;
}

@media (max-width: 599px) {
  .planner-page {
    padding-inline: 0.75rem;
  }

  .planner-date-nav {
    gap: 0;
  }

  .planner-date-nav__range {
    min-width: 0;
  }
}
</style>
