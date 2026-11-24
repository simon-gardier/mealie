import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import ShoppingListAddItemDialog from "./ShoppingListAddItemDialog.vue";
import type { ShoppingListItemOut } from "~/lib/api/types/household";

vi.mock("~/composables/shopping-list-page/use-shopping-list-item-editor", () => ({
  useShoppingListItemEditor: () => ({ createAssignFood: vi.fn() }),
}));

const BaseDialog = {
  name: "BaseDialog",
  props: ["modelValue", "submitDisabled"],
  emits: ["update:modelValue", "submit", "cancel"],
  template: "<div v-if=\"modelValue\" class=\"dialog\"><slot /><button class=\"add\" :disabled=\"submitDisabled\" @click=\"$emit('submit')\" /></div>",
};
const Details = { name: "ShoppingListItemDetails", emits: ["save"], template: "<div class=\"details\" />" };

function mountDialog(item: Partial<ShoppingListItemOut>) {
  return mount(ShoppingListAddItemDialog, {
    props: { modelValue: true, item: item as ShoppingListItemOut, labels: [], units: [], foods: [] },
    global: {
      mocks: { $globals: { icons: {} } },
      stubs: { BaseDialog, ShoppingListItemDetails: Details, InputLabelType: true, VCardText: { template: "<div><slot /></div>" } },
    },
  });
}

describe("shopping list add-item dialog", () => {
  it("can't add an item without a food or a note", async () => {
    const wrapper = mountDialog({ quantity: 1, note: "  " });
    expect(wrapper.get(".add").attributes("disabled")).toBeDefined();

    // Enter in the details form is ignored too, and the dialog stays open
    wrapper.findComponent(Details).vm.$emit("save");
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("save")).toBeUndefined();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("adds an item with a note on Enter and closes", async () => {
    const wrapper = mountDialog({ quantity: 1, note: "Moutarde" });
    expect(wrapper.get(".add").attributes("disabled")).toBeUndefined();

    wrapper.findComponent(Details).vm.$emit("save");
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("save")).toHaveLength(1);
    expect(wrapper.emitted("update:modelValue")).toEqual([[false]]);
  });

  it("adds an item with a chosen food from the Add button", async () => {
    const wrapper = mountDialog({ quantity: 1, note: "", foodId: "food-1" });
    await wrapper.get(".add").trigger("click");
    expect(wrapper.emitted("save")).toHaveLength(1);
  });
});
