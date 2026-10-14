import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import RecipeSaveReviewDialog from "./RecipeSaveReviewDialog.vue";
import type { RecipeSaveWarning } from "~/lib/recipe/save-warnings";

const warnings: RecipeSaveWarning[] = [
  { code: "empty-ingredients", count: 0 },
  { code: "missing-category", count: 0 },
  { code: "missing-time", count: 0 },
];
function setup(issues = warnings) {
  return mount(RecipeSaveReviewDialog, { props: { modelValue: true, warnings: issues, recipe: {} }, global: {
    mocks: { $globals: { icons: {} } },
    stubs: {
      BaseDialog: { props: ["modelValue"], template: "<div v-if=\"modelValue\"><slot name=\"header\"/><slot/><slot name=\"card-actions\"/></div>" },
      VCardText: { template: "<div><slot/></div>" },
      VToolbarTitle: { template: "<div><slot/></div>" },
      VIcon: true,
      VBtn: { props: ["disabled"], template: "<button :disabled=\"disabled\"><slot/></button>" },
      BaseButton: { props: ["text", "disabled"], template: "<button :disabled=\"disabled\">{{ text }}</button>" },
    },
  } });
}

describe("save warning pages", () => {
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
