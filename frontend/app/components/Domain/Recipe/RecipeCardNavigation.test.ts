import { shallowMount, flushPromises } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent, ref } from "vue";
import type { Component } from "vue";
import { afterEach, describe, expect, test, vi } from "vitest";
import RecipeCard from "./RecipeCard.vue";
import RecipeCardMobile from "./RecipeCardMobile.vue";

vi.mock("~/composables/use-logged-in-state", () => ({ useLoggedInState: () => ({ isOwnGroup: false }) }));
vi.mock("~/composables/use-users", () => ({ useUserSelfRatings: () => ({ userRatings: ref([]), setFavorite: vi.fn() }) }));
vi.mock("~/plugins/recipe-synesthesia.client", () => ({ playRecipeSynesthesia: vi.fn() }));
vi.mock("~/composables/api", () => ({ useStaticRoutes: () => ({ recipeImage: vi.fn() }), useUserApi: () => ({}) }));

const Card = defineComponent({ template: "<a v-bind=\"$attrs\"><slot /></a>" });
const Hover = defineComponent({ inheritAttrs: false, template: "<slot :props=\"{}\" :isHovering=\"false\" />" });
const ListItem = defineComponent({ template: "<div><slot name=\"prepend\" /><slot /></div>" });

afterEach(() => vi.unstubAllGlobals());

describe("recipe card navigation", () => {
  async function render(mobile: boolean, selected = false) {
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: "/g/family", component: Card },
      { path: "/g/family/r/soup", component: Card },
    ] });
    await router.push("/g/family");
    vi.stubGlobal("useRoute", () => router.currentRoute.value);
    vi.stubGlobal("useMealieAuth", () => ({ user: ref({ groupSlug: "family" }) }));
    vi.stubGlobal("useNuxtApp", () => ({ $globals: { icons: {} } }));
    const component: Component = mobile ? RecipeCardMobile : RecipeCard;
    const wrapper = shallowMount(component, {
      props: { name: "Soup", slug: "soup", recipeId: "id", description: "Description", ...(mobile ? { listMode: true } : {}) },
      attrs: selected ? { selected: true } : {},
      global: { plugins: [router], renderStubDefaultSlot: true, stubs: {
        VCard: Card, VHover: Hover, VListItem: ListItem,
        VExpandTransition: defineComponent({ template: "<div><slot /></div>" }),
        VCardTitle: true, VListItemTitle: true, VListItemSubtitle: true,
        VCardActions: true, VImg: true, VBtn: true, VTooltip: true, VSheet: true, VMenu: true, SafeMarkdown: true,
      } },
    });
    return { wrapper, router };
  }

  for (const mobile of [false, true]) {
    test(`${mobile ? "list" : "sticky"} card title opens the recipe`, async () => {
      const { wrapper, router } = await render(mobile);
      expect(wrapper.find("a").attributes("href")).toBe("/g/family/r/soup");
      await wrapper.find(mobile ? "v-list-item-title-stub" : "v-card-title-stub").trigger("click");
      await flushPromises();
      expect(router.currentRoute.value.path).toBe("/g/family/r/soup");
      wrapper.unmount();
    });
    test(`${mobile ? "list" : "sticky"} card preserves modified clicks`, async () => {
      const { wrapper, router } = await render(mobile);
      await wrapper.find("a").trigger("click", { ctrlKey: true });
      await flushPromises();
      expect(router.currentRoute.value.path).toBe("/g/family");
      wrapper.unmount();
    });
  }
  test("selection cards emit selection without navigating", async () => {
    const { wrapper, router } = await render(true, true);
    await wrapper.find("a").trigger("click");
    await flushPromises();
    expect(wrapper.emitted("selected")).toHaveLength(1);
    expect(router.currentRoute.value.path).toBe("/g/family");
    expect(wrapper.find("a").attributes("href")).toBeUndefined();
    wrapper.unmount();
  });
});
