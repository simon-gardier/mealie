import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import RecipeSaveReviewDialog from "./RecipeSaveReviewDialog.vue";
import type { RecipeSaveWarning } from "~/lib/recipe/save-warnings";
import type { Recipe } from "~/lib/api/types/recipe";
import { recipeSaveWarnings } from "~/lib/recipe/save-warnings";

const warnings: RecipeSaveWarning[] = [
  { code: "empty-ingredients", count: 0 },
  { code: "missing-category", count: 0 },
  { code: "missing-time", count: 0 },
];
function setup(issues = warnings, recipe: Recipe = {}) {
  return mount(RecipeSaveReviewDialog, {
    props: { modelValue: true, warnings: issues, recipe }, global: {
      mocks: { $globals: { icons: {} } },
      stubs: {
        BaseDialog: { props: ["modelValue"], template: "<div v-if=\"modelValue\"><slot name=\"header\"/><slot/><slot name=\"card-actions\"/></div>" },
        VCardText: { template: "<div><slot/></div>" },
        VToolbarTitle: { template: "<div><slot/></div>" },
        VIcon: true,
        VBtn: { props: ["disabled"], template: "<button :disabled=\"disabled\"><slot/></button>" },
        BaseButton: { props: ["text", "disabled"], template: "<button :disabled=\"disabled\">{{ text }}</button>" },
      },
    },
  });
}

describe("save warning pages", () => {
  it("does not use remarks or original text as the name of a cleared ingredient", async () => {
    const recipe: Recipe = {
      recipeIngredient: [{
        food: null, quantity: 100, unit: { name: "g" },
        note: "old ingredient name", originalText: "100 g mascarpone",
        substitutions: [{ note: "replacement note" }],
      }],
    };
    const wrapper = setup(recipeSaveWarnings(recipe, "ingredients"), recipe);
    expect(wrapper.get(".recipe-save-review-affected").text()).toBe("Ingredient 1");
    await wrapper.findAll("button").find(button => button.text() === "Next")!.trigger("click");
    expect(wrapper.get(".recipe-save-review-affected").text()).toBe("Ingredient 1 - substitute 1 (replacement note)");
    wrapper.unmount();
  });

  it("shows an empty substitute warning even when the parent ingredient is also empty", async () => {
    const recipe: Recipe = { recipeIngredient: [{ food: null, quantity: 100, unit: { name: "g" }, substitutions: [{}] }] };
    const wrapper = setup(recipeSaveWarnings(recipe, "ingredients"), recipe);
    expect(wrapper.get(".recipe-save-review-affected").text()).toBe("Ingredient 1");
    await wrapper.findAll("button").find(button => button.text() === "Next")!.trigger("click");
    expect(wrapper.get(".recipe-save-review-affected").text()).toBe("Ingredient 1 - substitute 1 (Empty row)");
    wrapper.unmount();
  });

  it("keeps the selected parent food name in substitution warnings", () => {
    const recipe: Recipe = { recipeIngredient: [{ food: { name: "butter" }, substitutions: [{ note: "oil" }] }] };
    const wrapper = setup(recipeSaveWarnings(recipe, "ingredients"), recipe);
    expect(wrapper.get(".recipe-save-review-affected").text()).toBe("Ingredient 1 (butter) - substitute 1 (oil)");
    wrapper.unmount();
  });

  it("shows one issue at a time and allows moving backward and forward", async () => {
    const wrapper = setup();
    const button = (label: string) => wrapper.findAll("button").find(item => item.text() === label)!;
    expect(wrapper.findAll("h3")).toHaveLength(1);
    expect(wrapper.get("h3").text()).toBe("Missing ingredients or empty rows");
    expect(button("Previous").attributes("disabled")).toBeDefined();
    await button("Next").trigger("click");
    expect(wrapper.get("h3").text()).toBe("No category selected");
    expect(wrapper.get("[role=\"status\"]").text()).toBe("Issue 2 of 3");
    await button("Next").trigger("click");
    expect(wrapper.get("h3").text()).toBe("Incomplete timing");
    expect(button("Next").attributes("disabled")).toBeDefined();
    await button("Previous").trigger("click");
    expect(wrapper.get("h3").text()).toBe("No category selected");
    wrapper.unmount();
  });

  it("allows saving from the first issue and resets on reopening", async () => {
    const wrapper = setup();
    const button = (label: string) => wrapper.findAll("button").find(item => item.text() === label)!;
    await button("Save anyway").trigger("click");
    expect(wrapper.emitted("confirm")).toHaveLength(1);
    await button("Next").trigger("click");
    await wrapper.setProps({ modelValue: false });
    await wrapper.setProps({ modelValue: true });
    expect(wrapper.get("[role=\"status\"]").text()).toBe("Issue 1 of 3");
    await button("Continue editing").trigger("click");
    expect(wrapper.emitted("cancel")).toHaveLength(1);
    wrapper.unmount();
  });

  it("omits navigation for a single issue", () => {
    const wrapper = setup([warnings[0]!]);
    expect(wrapper.find("nav").exists()).toBe(false);
    expect(wrapper.findAll("h3")).toHaveLength(1);
    wrapper.unmount();
  });
});
