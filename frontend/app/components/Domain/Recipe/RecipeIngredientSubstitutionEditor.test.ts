import { mount } from "@vue/test-utils";
import { describe, expect, test, vi } from "vitest";
import { nextTick } from "vue";
import RecipeIngredientSubstitutionEditor from "./RecipeIngredientSubstitutionEditor.vue";

const mocks = vi.hoisted(() => ({ createOne: vi.fn() }));

vi.mock("~/composables/store", () => ({
  useFoodStore: () => ({ actions: { createOne: mocks.createOne } }),
  useFoodData: () => ({ data: { name: "" }, reset: vi.fn() }),
}));

describe("RecipeIngredientSubstitutionEditor", () => {
  test("creates an unmatched substitute and assigns it to the searched row", async () => {
    const substitutions = [
      { substituteFoodId: null, note: "" },
      { substituteFoodId: null, note: "" },
    ];
    const foods = [{ id: "existing", name: "Butter" }];
    mocks.createOne.mockResolvedValueOnce({ id: "created", name: "Margarine" });

    const wrapper = mount(RecipeIngredientSubstitutionEditor, {
      props: { substitutions, foods },
      global: {
        mocks: { $globals: { icons: { delete: "delete", create: "create" } }, $vuetify: { display: { mdAndDown: false } } },
        stubs: {
          VAutocomplete: {
            props: ["search"],
            template: `<div><input :value="search" @input="$emit('update:search', $event.target.value)"><slot name="append-item" /></div>`,
          },
          VTextField: { template: "<input>" },
          VBtn: { template: "<button><slot /></button>" },
          VIcon: { template: "<span><slot /></span>" },
          BaseButton: { template: "<button class='create-food' @click='$emit(`click`)'>Create</button>" },
        },
      },
    });

    await wrapper.findAll("input")[0]!.setValue("Butter");
    expect(wrapper.findAll(".create-food")).toHaveLength(0);

    await wrapper.findAll("input")[2]!.setValue("Margarine");
    expect(wrapper.findAll(".create-food")).toHaveLength(1);
    await wrapper.find(".create-food").trigger("click");
    await nextTick();

    expect(mocks.createOne).toHaveBeenCalledWith(expect.objectContaining({ name: "Margarine" }));
    expect(substitutions.map(substitution => substitution.substituteFoodId)).toEqual([null, "created"]);
    expect(wrapper.emitted("food-changed")).toEqual([[1]]);
    wrapper.unmount();
  });
});
