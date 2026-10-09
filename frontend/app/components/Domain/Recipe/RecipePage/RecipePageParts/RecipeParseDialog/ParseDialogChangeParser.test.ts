import { flushPromises, shallowMount } from "@vue/test-utils";
import { describe, expect, test } from "vitest";
import ParseDialogChangeParser from "./ParseDialogChangeParser.vue";

function mountSettings() {
  return shallowMount(ParseDialogChangeParser, {
    props: { modelValue: "brute", availableParsers: [{ text: "Brute", value: "brute" }, { text: "AI", value: "openai" }], showNlpLanguageHint: false },
    global: { stubs: { VSelect: { name: "VSelect", props: ["modelValue", "items"], emits: ["update:modelValue"], template: "<div><slot v-for=\"item in items\" name=\"item\" :item=\"item\" :props=\"{ title: item.text }\" /></div>" }, VListItem: { props: ["title", "subtitle"], template: "<div class=\"method-option\">{{ title }} {{ subtitle }}</div>" }, VBtn: { template: "<button><slot /></button>" } } },
  });
}
describe("analysis method settings", () => {
  test("renders raw dropdown items with their title and description", () => {
    const wrapper = mountSettings();
    const options = wrapper.findAll(".method-option");
    expect(options).toHaveLength(2);
    expect(options[0].text()).toContain("Standard");
    expect(options[0].text()).toContain("Matches quantities, units and foods against known items.");
    expect(options[1].text()).toContain("AI assistant");
    expect(options[1].text()).toContain("Uses AI to interpret more complex ingredient descriptions.");
    expect(wrapper.emitted("parse")).toBeUndefined();
  });
  test("stages a selection without replacing corrections until Analyze again is pressed", async () => {
    const wrapper = mountSettings();
    wrapper.findComponent({ name: "VSelect" }).vm.$emit("update:modelValue", "openai");
    await flushPromises();
    expect(wrapper.emitted("parse")).toBeUndefined();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    await wrapper.find("button").trigger("click");
    await flushPromises();
    expect(wrapper.emitted("update:modelValue")).toEqual([["openai"]]);
    expect(wrapper.emitted("parse")).toHaveLength(1);
  });
  test("allows explicitly retrying the same analyzer", async () => {
    const wrapper = mountSettings();
    await wrapper.find("button").trigger("click");
    await flushPromises();
    expect(wrapper.emitted("parse")).toHaveLength(1);
  });
});
