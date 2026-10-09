import { shallowMount } from "@vue/test-utils";
import { describe, expect, test } from "vitest";
import type { ParsedIngredient } from "~/lib/api/types/recipe";
import ParseDialogReview from "./ParseDialogReview.vue";

function mountReview() {
  const ingredients = [
    { input: "250 g flour", ingredient: { quantity: 250, food: { id: "flour", name: "flour" }, unit: { name: "gram", abbreviation: "g", useAbbreviation: true }, note: "sifted" } },
    { input: "2 eggs", ingredient: { quantity: 2, food: { id: "egg", name: "egg" } } },
    { input: "25 cl milk", ingredient: { quantity: 25 } },
  ] as ParsedIngredient[];
  return shallowMount(ParseDialogReview, {
    props: { modelValue: ingredients },
    global: {
      mocks: { $globals: { icons: { arrowUpDown: "", alert: "" } } },
      stubs: { VueDraggable: { template: "<div><slot /></div>" }, VIcon: { template: "<i />" }, VBtn: { template: "<button><slot /></button>" }, RecipeIngredientEditor: { template: "<div><slot name=\"before-fields\" /><slot name=\"editor-actions\" /></div>" } },
    },
  });
}
describe("final ingredient review", () => {
  test("shows readable summaries and flags a missing food without flagging an optional unit", () => {
    const wrapper = mountReview();
    const rows = wrapper.findAll("details");
    expect(rows[0]?.find("summary").text()).toContain("250 g flour");
    expect(rows[0]?.text()).toContain("sifted");
    expect(rows[1]?.find(".review-attention").exists()).toBe(false);
    expect(rows[2]?.find("summary").text()).toContain("25 cl milk");
    expect(rows[2]?.find(".review-attention").text()).toContain("Choose a food");
  });
  test("retains the source text inside the expandable editor", () => {
    const wrapper = mountReview();
    expect(wrapper.findAll(".review-original")[2]?.text()).toContain("25 cl milk");
    expect(wrapper.findAll("details").every(row => !row.element.open)).toBe(true);
  });
  test("supports moving a row with buttons as an alternative to dragging", async () => {
    const wrapper = mountReview();
    await wrapper.findAll("details")[0]?.findAll("button")[1]?.trigger("click");
    expect(wrapper.findAll("summary")[0]?.text()).toContain("2 egg");
    expect(wrapper.findAll("summary")[1]?.text()).toContain("250 g flour");
  });
});
