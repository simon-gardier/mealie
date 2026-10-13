import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import RecipeIngredientEditor from "./RecipeIngredientEditor.vue";

vi.mock("#app", () => ({ useNuxtApp: () => ({ $globals: { icons: {} } }) }));
vi.mock("~/composables/api", () => ({ useUserApi: () => ({}), usePublicExploreApi: () => ({ explore: {} }) }));
vi.mock("~/composables/recipes/use-recipe-search", () => ({ useRecipeSearch: () => ({ query: ref(""), data: ref([]) }) }));
vi.mock("~/composables/store", () => ({
  useFoodStore: () => ({ store: ref([]), actions: {} }), useUnitStore: () => ({ store: ref([]), actions: {} }),
  useFoodData: () => ({ data: {}, reset() {} }), useUnitData: () => ({ data: {}, reset() {} }),
}));
vi.mock("~/composables/use-search", () => ({ useSearch: () => ({ search: ref(""), filtered: ref([]) }) }));

describe("ingredient substitution controls", () => {
  it.each([false, true])("adds a substitute and collapses the last row (compact: %s)", async (compact) => {
    vi.stubGlobal("useRoute", () => ({ params: {} }));
    vi.stubGlobal("useMealieAuth", () => ({ user: ref({ groupSlug: "home" }) }));
    vi.stubGlobal("useLoggedInState", () => ({ isOwnGroup: ref(true) }));
    const ingredient = { quantity: 1, note: "Flour" };
    const wrapper = mount(RecipeIngredientEditor, {
      props: { modelValue: ingredient, showSubstitutionControls: true, compact, enableContextMenu: true, contextMenuBelow: true },
      global: {
        mocks: { $globals: { icons: {} }, $vuetify: { display: { mdAndDown: false } } },
        stubs: {
          RecipeIngredientEditorLayout: { template: "<div><slot /></div>" },
          VBtn: { template: "<button><slot /></button>" }, VIcon: true,
          VAutocomplete: true, VTextField: true, VNumberInput: true, VTooltip: true, VMenu: true, BaseButtonGroup: true, BaseButton: true,
          RecipeIngredientSubstitutionEditor: { name: "RecipeIngredientSubstitutionEditor", props: ["substitutions"], template: "<div class='substitutes'>{{ substitutions.length }}</div>" },
        },
      },
    });
    const addButton = wrapper.findAll("button").find(button => button.text().includes("Add a substitute"));
    expect(addButton).toBeDefined();
    await addButton!.trigger("click");
    await flushPromises();
    expect(wrapper.find(".substitutes").text()).toBe("1");
    wrapper.findComponent({ name: "RecipeIngredientSubstitutionEditor" }).vm.$emit("delete", 0);
    await flushPromises();
    expect(wrapper.find(".substitutes").exists()).toBe(false);
    wrapper.unmount();
    vi.unstubAllGlobals();
  });
});
