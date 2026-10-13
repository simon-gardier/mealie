import { flushPromises, mount } from "@vue/test-utils";
import { ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import RecipeFavoriteBadge from "./RecipeFavoriteBadge.vue";

const mocks = vi.hoisted(() => ({ setFavorite: vi.fn(), play: vi.fn() }));
vi.mock("~/composables/use-users", () => ({ useUserSelfRatings: () => ({ userRatings: ref([]), setFavorite: mocks.setFavorite }) }));
vi.mock("~/plugins/recipe-synesthesia.client", () => ({ playRecipeSynesthesia: mocks.play }));

describe("visible favorite button", () => {
  it.each([true, false])("anchors successful additions to the clicked heart (API success: %s)", async (success) => {
    mocks.play.mockClear();
    let resolve!: (success: boolean) => void;
    mocks.setFavorite.mockReturnValueOnce(new Promise<boolean>((done) => { resolve = done; }));
    const wrapper = mount(RecipeFavoriteBadge, {
      props: { recipeId: "recipe", showAlways: true },
      global: {
        mocks: { $globals: { icons: {} } },
        stubs: {
          VTooltip: { template: "<div><slot name='activator' :props='{}' /></div>" },
          VBtn: { template: "<button><slot /></button>" }, VIcon: true,
        },
      },
    });
    vi.spyOn(wrapper.get("button").element, "getBoundingClientRect").mockReturnValue({ left: 80, top: 100, width: 44, height: 44 } as DOMRect);
    await wrapper.get("button").trigger("click");
    const anotherButton = document.createElement("button");
    document.body.append(anotherButton);
    anotherButton.focus();
    resolve(success);
    await flushPromises();
    if (success) expect(mocks.play).toHaveBeenCalledWith({ x: 102, y: 122 });
    else expect(mocks.play).not.toHaveBeenCalled();
    anotherButton.remove();
    wrapper.unmount();
  });
});
