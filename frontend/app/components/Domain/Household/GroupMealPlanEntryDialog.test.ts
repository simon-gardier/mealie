import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import GroupMealPlanEntryDialog from "./GroupMealPlanEntryDialog.vue";

vi.mock("~/composables/use-group-mealplan", () => ({ usePlanTypeOptions: () => [{ text: "Dinner", value: "dinner" }, { text: "Lunch", value: "lunch" }] }));
vi.mock("~/composables/use-mealplan-rules", () => ({ useMealplanRules: () => ({ rules: { value: [] } }), buildRuleQueryFilter: () => null }));

function setup() {
  return mount(GroupMealPlanEntryDialog, {
    props: { modelValue: true, date: new Date(2026, 9, 12) },
    global: {
      mocks: { $globals: { icons: {} } },
      stubs: {
        BaseDialog: { template: "<div><slot /><slot name=\"card-actions\" /></div>" },
        MealPlanDatePicker: { props: ["modelValue"], template: "<div class=\"date-picker\" />" },
        RecipeSelector: { name: "RecipeSelector", props: ["modelValue"], methods: { reset() {} }, template: "<div class=\"recipe-selector\" />" },
        RecipeCardLineItem: { props: ["recipe"], template: "<div class=\"chosen-recipe\">{{ recipe.name }}<slot name=\"append\" /></div>" },
        VTabs: { name: "VTabs", props: ["modelValue"], template: "<div class=\"tabs\"><slot /></div>" }, VTab: true, VIcon: true, VSwitch: true, BaseEmptyState: true,
        VSelect: { name: "VSelect", props: ["modelValue", "disabled"], template: "<select class=\"meal-type\" :disabled=\"disabled\" />" },
        VTextField: { props: ["modelValue"], template: "<input :value=\"modelValue\" @input=\"$emit('update:modelValue', $event.target.value)\" />" },
        VTextarea: { props: ["modelValue"], template: "<textarea :value=\"modelValue\" @input=\"$emit('update:modelValue', $event.target.value)\" />" },
        BaseButton: { props: ["disabled", "text"], template: "<button class=\"submit\" :disabled=\"disabled\">{{ text }}</button>" },
        VBtn: { template: "<button><slot /></button>" },
      },
    },
  });
}

describe("meal entry dialog", () => {
  it("allows choosing a meal type before selecting a recipe, then submits the selected date and recipe", async () => {
    const wrapper = setup();
    expect(wrapper.get(".submit").attributes("disabled")).toBeDefined();
    expect(wrapper.get(".meal-type").attributes("disabled")).toBeUndefined();
    wrapper.findComponent({ name: "VSelect" }).vm.$emit("update:modelValue", "lunch");
    wrapper.findComponent({ name: "RecipeSelector" }).vm.$emit("update:modelValue", { id: "recipe-1", name: "Soup" });
    await wrapper.vm.$nextTick();
    await wrapper.get(".submit").trigger("click");
    expect(wrapper.emitted("create")?.[0]?.[0]).toMatchObject({ date: "2026-10-12", entryType: "lunch", recipeId: "recipe-1", title: "", text: "" });
    expect(wrapper.emitted("update:modelValue")).toEqual([[false]]);
    wrapper.unmount();
  });

  it("requires a title for a custom meal and submits its note without a recipe", async () => {
    const wrapper = setup();
    wrapper.findComponent({ name: "VTabs" }).vm.$emit("update:modelValue", "note");
    await wrapper.vm.$nextTick();
    expect(wrapper.get(".submit").attributes("disabled")).toBeDefined();
    await wrapper.get("input").setValue("Restaurant");
    await wrapper.get("textarea").setValue("Avec la famille");
    await wrapper.get(".submit").trigger("click");
    expect(wrapper.emitted("create")?.[0]?.[0]).toMatchObject({ date: "2026-10-12", recipeId: null, title: "Restaurant", text: "Avec la famille" });
    wrapper.unmount();
  });

  it("initializes an existing custom meal and preserves its identity when updating", async () => {
    const wrapper = setup();
    await wrapper.setProps({ modelValue: false });
    await wrapper.setProps({
      modelValue: true,
      entry: { id: 7, groupId: "group", userId: "user", householdId: "household", date: "2026-10-15", entryType: "lunch", title: "Restaurant", text: "Original note", recipeId: null },
    });
    expect((wrapper.get("input").element as HTMLInputElement).value).toBe("Restaurant");
    await wrapper.get(".submit").trigger("click");
    expect(wrapper.emitted("update")?.[0]?.[0]).toMatchObject({ id: 7, groupId: "group", userId: "user", date: "2026-10-15", entryType: "lunch", recipeId: null, text: "Original note" });
    expect(wrapper.emitted("create")).toBeUndefined();
    wrapper.unmount();
  });
});
