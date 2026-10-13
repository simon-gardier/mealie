import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import RecipeContextMenu from "./RecipeContextMenu.vue";

afterEach(() => vi.unstubAllGlobals());

describe("favorite action in the dots menu", () => {
  it("passes the dots button center rather than the selected menu row", async () => {
    vi.stubGlobal("useNuxtApp", () => ({ $globals: { icons: {} } }));
    const wrapper = mount(RecipeContextMenu, {
      props: { slug: "soup", recipeId: "recipe", name: "Soup" },
      global: {
        mocks: { $globals: { icons: {} } },
        stubs: {
          RecipeContextMenuContent: { template: "<button class='favorite-action' @click=\"$emit('favorite')\">Favorite</button>" },
          VMenu: { name: "VMenu", setup: () => ({ activatorProps: { ref: () => {} } }), template: "<div><slot name='activator' :props='activatorProps' /><slot /></div>" },
          VBtn: { template: "<button class='dots'><slot /></button>" }, VIcon: true,
        },
      },
    });
    vi.spyOn(wrapper.get(".dots").element, "getBoundingClientRect").mockReturnValue({ left: 300, top: 400, width: 44, height: 44 } as DOMRect);
    await wrapper.get(".dots").trigger("click");
    wrapper.findComponent({ name: "VMenu" }).vm.$emit("update:modelValue", true);
    await flushPromises();
    await wrapper.get(".favorite-action").trigger("click");
    expect(wrapper.emitted("favorite")).toEqual([[{ x: 322, y: 422 }]]);
    wrapper.unmount();
  });
});
