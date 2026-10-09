import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Organizer } from "~/lib/api/types/non-generated";
import RecipeOrganizerSelector from "./RecipeOrganizerSelector.vue";

vi.mock("~/composables/store", () => {
  const store = () => ({ store: { value: [] }, actions: {} });
  return { useCategoryStore: store, useFoodStore: store, useLabelStore: store,
    useHouseholdStore: store, useTagStore: store, useToolStore: store };
});
vi.mock("~/composables/store/use-user-store", () => ({ useUserStore: () => ({ store: { value: [] }, actions: {} }) }));
vi.mock("~/composables/use-utils", () => ({ normalizeFilter: () => true }));

const Chip = defineComponent({
  props: { text: String },
  template: "<div class=\"organizer-chip\"><slot name=\"prepend\" />{{ text }}</div>",
});

describe("organizer chip deletion", () => {
  beforeEach(() => vi.stubGlobal("useNuxtApp", () => ({ $globals: { icons: {} } })));
  afterEach(() => vi.unstubAllGlobals());
  for (const selectorType of [Organizer.Category, Organizer.Tag]) {
    it(`keeps remaining ${selectorType} visible after successive deletions`, async () => {
      const items = [
        { id: "one", name: "One" },
        { id: "two", name: "Two" },
        { id: "three", name: "Three" },
      ];
      const wrapper = mount(RecipeOrganizerSelector, {
        props: { selectorType, modelValue: items, externalChips: true, showAdd: false },
        global: { mocks: { $globals: { icons: {} } }, stubs: { VChip: Chip, VIcon: true, VAutocomplete: true, BaseButton: true, RecipeOrganizerDialog: true } },
      });
      await wrapper.findAll("button")[0].trigger("click");
      const remaining = wrapper.emitted("update:modelValue")![0][0];
      await wrapper.setProps({ modelValue: remaining });
      expect(wrapper.findAll(".organizer-chip").map(chip => chip.text())).toEqual(["Two", "Three"]);
      await wrapper.findAll("button")[0].trigger("click");
      await wrapper.setProps({ modelValue: wrapper.emitted("update:modelValue")![1][0] });
      expect(wrapper.findAll(".organizer-chip").map(chip => chip.text())).toEqual(["Three"]);
    });
  }
});
