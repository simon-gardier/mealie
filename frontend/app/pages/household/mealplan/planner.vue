<template>
  <v-container class="planner-page">
    <RecipeDialogAddToShoppingList v-if="shoppingLists" v-model="shoppingListDialog" :recipes="weekRecipesWithScales"
      :shopping-lists="shoppingLists" />
    <div class="planner-title-image">
      <v-img src="/menus.png" :alt="$t('meal-plan.dinner-this-week')" max-width="360" />
    </div>
    <div class="planner-date-nav">
      <v-btn :icon="$globals.icons.chevronLeft" variant="text" density="comfortable" @click="() => changeWeek(-1)" />
      <v-menu v-model="state.picker" :close-on-content-click="false" transition="scale-transition" offset-y
        min-width="auto">
        <template #activator="{ props }">
          <v-btn color="primary" class="planner-date-nav__range" v-bind="props">
            <v-icon start>
              {{ $globals.icons.calendar }}
            </v-icon>
            {{ $d(weekRange.start, "short") }} - {{ $d(weekRange.end, "short") }}
          </v-btn>
        </template>

        <v-card>
          <MealPlanDatePicker v-model="state.range" hide-header :multiple="'range'" :first-day-of-week="firstDayOfWeek"
            :local="$i18n.locale" />

          <v-card-text>
            <v-number-input v-model="numberOfDaysPast" :min="0" inset :label="$t('meal-plan.numberOfDaysPast-label')"
              :hint="$t('meal-plan.numberOfDaysPast-hint')" persistent-hint />
          </v-card-text>

          <v-card-text>
            <v-number-input v-model="numberOfDays" :min="1" inset :label="$t('meal-plan.numberOfDays-label')"
              :hint="$t('meal-plan.numberOfDays-hint')" persistent-hint />
          </v-card-text>
        </v-card>
      </v-menu>
      <v-btn :icon="$globals.icons.chevronRight" variant="text" density="comfortable" @click="() => changeWeek(1)" />
    </div>
    <div class="planner-content">
      <NuxtPage :mealplans="mealsByDate" :actions="actions" :loading="loading" />
    </div>

    <div class="planner-bottom-actions">
      <BaseButton color="primary" :icon="$globals.icons.cartCheck" :text="$t('meal-plan.add-to-shopping-list')"
        :disabled="!hasRecipes" @click="addAllToList" />
      <v-btn :icon="$globals.icons.cog" variant="text" :aria-label="$t('general.settings')"
        :title="$t('general.settings')" @click="router.push('/household/mealplan/settings')" />
    </div>

    <v-row />
  </v-container>
</template>

<script setup lang="ts">
import { addDays, differenceInCalendarDays, endOfWeek, format, isSameDay, isValid, parseISO, startOfWeek } from "date-fns";
import RecipeDialogAddToShoppingList from "~/components/Domain/Recipe/RecipeDialogAddToShoppingList.vue";
import { useAddToShoppingListDialog } from "~/composables/shopping-list-page/use-add-to-shopping-list-dialog";
import { useMealplans } from "~/composables/use-group-mealplan";
import { useHouseholdSelf } from "~/composables/use-households";
import { useUserMealPlanPreferences } from "~/composables/use-users/preferences";

const TABS = {
  view: "household-mealplan-planner-view",
};

const route = useRoute();
const router = useRouter();
const i18n = useI18n();
const { household, actions: householdActions } = useHouseholdSelf();
const { shoppingLists, open: shoppingListDialog, addAllToList } = useAddToShoppingListDialog();

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
const numberOfDaysPast = ref<number>(mealPlanPreferences.value.numberOfDaysPast || 0);
const numberOfDays = ref<number>(mealPlanPreferences.value.numberOfDays || 7);
watch(numberOfDaysPast, (val) => {
  mealPlanPreferences.value.numberOfDaysPast = Number(val);
});
watch(numberOfDays, (val) => {
  mealPlanPreferences.value.numberOfDays = Number(val);
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

// Initialize dates from query parameters or the current Monday-through-Sunday week.
const currentDate = new Date();
const initialStartDate = safeParseISO(route.query.start as string, startOfWeek(currentDate, { weekStartsOn: 1 }));
const initialEndDate = safeParseISO(route.query.end as string, endOfWeek(currentDate, { weekStartsOn: 1 }));

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
  const { start, end } = weekRange.value;
  const stepSize = differenceInCalendarDays(end, start) + 1;
  state.value.range = [
    addDays(start, step * stepSize),
    addDays(end, step * stepSize),
  ];
}

const weekRange = computed(() => {
  const sorted = [...state.value.range].sort((a, b) => a.getTime() - b.getTime());

  const start = sorted[0];
  const end = sorted[sorted.length - 1];

  if (start && end) {
    return { start, end };
  }
  return {
    start: addDays(new Date(), adjustForToday(-numberOfDaysPast.value)),
    end: addDays(new Date(), adjustForToday(numberOfDays.value)),
  };
});

// Update query parameters when date range changes
watch(weekRange, (newRange) => {
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

const { mealplans, actions, loading } = useMealplans(weekRange);

function filterMealByDate(date: Date) {
  if (!mealplans.value) return [];
  return mealplans.value.filter((meal) => {
    const mealDate = parseISO(meal.date);
    return isSameDay(mealDate, date);
  });
}

function adjustForToday(days: number) {
  // e.g. If the user wants 7 days, we subtract one to do "today + 6"
  // e.g. If the user wants 2 days in the past, we keep it the same to do "today - 2"
  return days > 0 ? days - 1 : days;
}

const days = computed(() => {
  const numDays
    = Math.floor((weekRange.value.end.getTime() - weekRange.value.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Calculate absolute value
  if (numDays < 0) return [];

  return Array.from(Array(numDays).keys()).map(
    (i) => {
      const date = new Date(weekRange.value.start.getTime());
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

const hasRecipes = computed(() => {
  return mealsByDate.value.some(day => day.meals.some(meal => meal.recipe));
});

const weekRecipesWithScales = computed(() => {
  return mealsByDate.value
    .flatMap(({ meals }) => meals)
    .map(({ recipe }) => recipe)
    .filter(recipe => recipe)
    .map(recipe => ({ scale: 1, ...recipe }));
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

.planner-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.planner-actions :deep(.v-btn),
.planner-actions :deep(.v-btn__overlay) {
  border-radius: 50% !important;
}

.planner-date-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  margin: 0.5rem 0 1.25rem;
}

.planner-date-nav__range {
  min-width: min(100%, 300px);
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
