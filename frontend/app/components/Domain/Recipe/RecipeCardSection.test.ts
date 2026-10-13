import { flushPromises, shallowMount } from "@vue/test-utils";
import { ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import RecipeCardSection from "./RecipeCardSection.vue";

const mocks = vi.hoisted(() => ({ fetchMore: vi.fn() }));
vi.mock("~/composables/recipes", () => ({ useLazyRecipes: () => ({ fetchMore: mocks.fetchMore, getRandom: vi.fn() }) }));
vi.mock("~/composables/use-logged-in-state", () => ({ useLoggedInState: () => ({ isOwnGroup: ref(true) }) }));
vi.mock("~/composables/use-users/preferences", () => ({ useUserSortPreferences: () => ref({ useMobileCards: false, orderBy: "name", orderDirection: "asc" }) }));
vi.mock("@vueuse/core", () => ({ useThrottleFn: (fn: () => unknown) => fn }));
afterEach(() => vi.unstubAllGlobals());
const rows = (count: number) => Array.from({ length: count }, (_, index) => ({ id: String(index), slug: `recipe-${index}`, name: `Recipe ${index}` }));

async function render(count: number) {
  mocks.fetchMore.mockReset().mockResolvedValueOnce(rows(count)).mockResolvedValue(rows(32));
  vi.stubGlobal("useMealieAuth", () => ({ user: ref({ groupSlug: "family" }) }));
  vi.stubGlobal("useNuxtApp", () => ({ $globals: { icons: {} } }));
  vi.stubGlobal("useRoute", () => ({ params: {}, path: "/g/family" }));
  vi.stubGlobal("useRouter", () => ({ push: vi.fn() }));
  vi.stubGlobal("useScrollPosition", () => ({ savePosition: vi.fn(), getSavedPage: () => 0, restorePosition: vi.fn() }));
  let intersect!: (visible: boolean) => void;
  const wrapper = shallowMount(RecipeCardSection, {
    props: { disableToolbar: true },
    global: {
      renderStubDefaultSlot: true,
      directives: { intersect: { mounted: (_element, binding) => { intersect = binding.value; } } },
      stubs: { VCard: { template: "<div class='sentinel' />" }, VRow: { template: "<div><slot /></div>" }, VCol: true, VFadeTransition: true, RecipeLoading: true, AppScrollToTop: true, BaseNoResultsAlert: true },
    },
  });
  await flushPromises();
  return { wrapper, intersect: (visible: boolean) => intersect(visible) };
}

describe("recipe listing infinite scrolling", () => {
  it("does not fetch on viewport exit, but does fetch the next page on entry", async () => {
    const { wrapper, intersect } = await render(64);
    expect(mocks.fetchMore).toHaveBeenCalledTimes(1);
    intersect(false);
    await flushPromises();
    expect(mocks.fetchMore).toHaveBeenCalledTimes(1);
    intersect(true);
    await flushPromises();
    expect(mocks.fetchMore).toHaveBeenCalledTimes(2);
    expect(mocks.fetchMore.mock.calls[1]?.slice(0, 2)).toEqual([3, 32]);
    intersect(false);
    await flushPromises();
    expect(mocks.fetchMore).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it("stops observing after a partial initial batch", async () => {
    const { wrapper } = await render(45);
    expect(wrapper.find(".sentinel").exists()).toBe(false);
    expect(mocks.fetchMore).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });
});
