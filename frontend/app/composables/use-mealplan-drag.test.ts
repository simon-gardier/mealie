import { effectScope, ref } from "vue";
import { describe, expect, test, vi } from "vitest";
import { useMealplanDrag } from "./use-mealplan-drag";
import type { MealsByDate } from "./use-group-mealplan";

function setup(success: boolean) {
  const plans = ref<MealsByDate[]>([{ date: new Date(2026, 9, 8), meals: [{ id: 1, date: "2026-10-08", entryType: "lunch", title: "Soup", recipeId: "recipe", groupId: "g", householdId: "h", userId: "u" }] }, { date: new Date(2026, 9, 9), meals: [] }]);
  const save = vi.fn(async () => success);
  const refresh = vi.fn(async () => {
    if (success) {
      const entry = plans.value[0]!.meals.pop()!;
      plans.value[1]!.meals.push({ ...entry, date: "2026-10-09", entryType: "dinner" });
    }
  });
  const error = vi.fn();
  const scope = effectScope();
  const drag = scope.run(() => useMealplanDrag(() => plans.value, ["lunch", "dinner"], save, refresh, error))!;
  return { drag, save, refresh, error, plans, scope };
}

describe("meal planner moves", () => {
  test("saves date and meal type while retaining the original entry until refresh", async () => {
    const { drag, save, plans, scope } = setup(true);
    await drag.move(1, "2026-10-09", "dinner");
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ id: 1, date: "2026-10-09", entryType: "dinner", recipeId: "recipe" }));
    expect(plans.value[0]!.meals).toHaveLength(0);
    expect(drag.slots["2026-10-09"]!.dinner).toHaveLength(1);
    expect(drag.saving.value).toBe(false);
    scope.stop();
  });
  test("restores the source on failure and skips unchanged drops", async () => {
    const { drag, save, error, refresh, scope } = setup(false);
    await drag.move(1, "2026-10-08", "lunch");
    expect(save).not.toHaveBeenCalled();
    await drag.move(1, "2026-10-09", "dinner");
    expect(error).toHaveBeenCalledOnce();
    expect(refresh).not.toHaveBeenCalled();
    expect(drag.slots["2026-10-08"]!.lunch).toHaveLength(1);
    expect(drag.slots["2026-10-09"]!.dinner).toHaveLength(0);
    scope.stop();
  });
});
