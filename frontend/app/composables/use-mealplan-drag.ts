import { format } from "date-fns";
import { reactive, ref, watch } from "vue";
import type { MealsByDate } from "./use-group-mealplan";
import type { PlanEntryType, ReadPlanEntry } from "~/lib/api/types/meal-plan";

export function useMealplanDrag(
  plans: () => MealsByDate[],
  types: PlanEntryType[],
  save: (entry: ReadPlanEntry) => Promise<boolean>,
  refresh: () => Promise<void>,
  onError: () => void,
) {
  const slots = reactive<Record<string, Record<string, ReadPlanEntry[]>>>({});
  const dragging = ref(false);
  const saving = ref(false);
  function reset() {
    for (const key of Object.keys(slots)) Reflect.deleteProperty(slots, key);
    for (const plan of plans()) {
      slots[format(plan.date, "yyyy-MM-dd")] = Object.fromEntries(types.map(type => [type, plan.meals.filter(meal => meal.entryType === type)]));
    }
  }
  watch(plans, reset, { immediate: true, deep: true });

  async function move(id: number, date: string, type: PlanEntryType) {
    dragging.value = false;
    const entry = plans().flatMap(plan => plan.meals).find(meal => meal.id === id);
    if (!entry || saving.value || (entry.date === date && entry.entryType === type)) { reset(); return; }
    saving.value = true;
    try {
      if (!await save({ ...entry, date, entryType: type })) throw new Error("Meal move failed");
      await refresh();
    }
    catch { onError(); }
    finally { saving.value = false; reset(); }
  }
  return { slots, dragging, saving, move };
}
