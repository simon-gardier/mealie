import { shallowMount } from "@vue/test-utils";
import { defineComponent, ref } from "vue";
import { afterEach, expect, test, vi } from "vitest";
import RecipeOrganizerSelector from "./RecipeOrganizerSelector.vue";
import { Organizer } from "~/lib/api/types/non-generated";

vi.mock("~/composables/store", () => {
  const store = () => ({ store: ref([]), actions: {} });
  return { useCategoryStore: store, useFoodStore: store, useLabelStore: store, useHouseholdStore: store, useTagStore: store, useToolStore: store };
});
vi.mock("~/composables/store/use-user-store", () => ({ useUserStore: () => ({ store: ref([]), actions: {} }) }));
vi.mock("~/composables/use-utils", () => ({ normalizeFilter: vi.fn() }));

// Vuetify 4 gives chip slots the raw item separately from internalItem.
const Autocomplete = defineComponent({
  props: ["modelValue"],
  template: "<div class=\"autocomplete\"><slot v-for=\"(item, index) in modelValue\" name=\"chip\" :item=\"item\" :internalItem=\"{ raw: item, title: item.name, value: item.name }\" :index=\"index\" /></div>",
});
const Chip = defineComponent({ props: ["text"], template: "<span>{{ text }}<slot name=\"prepend\" /></span>" });

afterEach(() => vi.unstubAllGlobals());

test.each([Organizer.Category, Organizer.Tag, Organizer.Tool, Organizer.Food, Organizer.Label])("%s input survives selecting, adding and removing values with Vuetify 4 slots", async (selectorType) => {
  vi.stubGlobal("useNuxtApp", () => ({ $globals: { icons: { close: "close" } } }));
  const wrapper = shallowMount(RecipeOrganizerSelector, {
    props: { selectorType, modelValue: [], showAdd: false },
    global: { stubs: { VAutocomplete: Autocomplete, VChip: Chip, VIcon: true } },
  });
  const first = { id: "first", name: "Vegetarian" };
  const second = { id: "second", name: "Dinner" };
  await wrapper.setProps({ modelValue: [first] });
  expect(wrapper.find(".autocomplete").exists()).toBe(true);
  expect(wrapper.text()).toContain("Vegetarian");
  await wrapper.setProps({ modelValue: [first, second] });
  expect(wrapper.text()).toContain("Dinner");
  await wrapper.find(".organizer-chip-remove").trigger("click");
  expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([[second]]);
  await wrapper.setProps({ modelValue: [] });
  expect(wrapper.find(".autocomplete").exists()).toBe(true);
  wrapper.unmount();
});
