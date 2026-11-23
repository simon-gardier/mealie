import { format } from "date-fns";
import { reactive, ref, watch } from "vue";
import type { MealsByDate } from "./use-group-mealplan";
import type { PlanEntryType, PlanEntryOut } from "~/lib/api/types/meal-plan";

const WEEK_SEPARATOR = "~";

/**
 * Identifies a planner column. A week starts on the same date as its first day, so week columns
 * also carry their end date to keep their meals apart from that day's meals.
 */
export function mealplanSlotKey(plan: Pick<MealsByDate, "date" | "endDate">): string {
  const date = format(plan.date, "yyyy-MM-dd");
  return plan.endDate ? `${date}${WEEK_SEPARATOR}${format(plan.endDate, "yyyy-MM-dd")}` : date;
}

function parseSlotKey(key: string): { date: string; endDate: string | null } {
  const [date = key, endDate] = key.split(WEEK_SEPARATOR);
  return { date, endDate: endDate || null };
}

export function useMealplanDrag(
  plans: () => MealsByDate[],
  types: PlanEntryType[],
  save: (entry: PlanEntryOut) => Promise<boolean>,
  refresh: () => Promise<void>,
  onError: () => void,
) {
  const slots = reactive<Record<string, Record<string, PlanEntryOut[]>>>({});
  const dragging = ref(false);
  const saving = ref(false);
  function reset() {
    for (const key of Object.keys(slots)) Reflect.deleteProperty(slots, key);
    for (const plan of plans()) {
      slots[mealplanSlotKey(plan)] = Object.fromEntries(types.map(type => [type, plan.meals.filter(meal => meal.entryType === type)]));
    }
  }
  watch(plans, reset, { immediate: true, deep: true });

  async function move(id: number, slotKey: string, type: PlanEntryType) {
    dragging.value = false;
    const { date, endDate } = parseSlotKey(slotKey);
    const entry = plans().flatMap(plan => plan.meals).find(meal => meal.id === id);
    const unchanged = entry && entry.date === date && (entry.endDate ?? null) === endDate && entry.entryType === type;
    if (!entry || saving.value || unchanged) { reset(); return; }
    saving.value = true;
    try {
      // moving between a week and a day schedules or unschedules the meal
      if (!await save({ ...entry, date, endDate, entryType: type })) throw new Error("Meal move failed");
      await refresh();
    }
    catch { onError(); }
    finally { saving.value = false; reset(); }
  }
  return { slots, dragging, saving, move };
}
