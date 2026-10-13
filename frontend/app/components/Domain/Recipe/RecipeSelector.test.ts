import { flushPromises, mount } from "@vue/test-utils";
import { ref, watch } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RecipeSelector from "./RecipeSelector.vue";

const mocks = vi.hoisted(() => ({ fetchMore: vi.fn() }));
vi.mock("~/composables/recipes", () => ({ useLazyRecipes: () => ({ fetchMore: mocks.fetchMore }) }));
vi.mock("~/composables/store", () => ({ useCategoryStore: () => ({ store: ref([]) }), useTagStore: () => ({ store: ref([]) }) }));
vi.mock("@vueuse/core", () => ({ watchDebounced: (source: Parameters<typeof watch>[0], callback: Parameters<typeof watch>[1]) => watch(source, callback) }));

const rows = (start: number, count: number) => Array.from({ length: count }, (_, index) => ({ id: String(start + index), name: `Recipe ${start + index}` }));
function render() {
  return mount(RecipeSelector, {
    props: { calm: true },
    global: {
      mocks: { $globals: { icons: {} } },
      stubs: {
        VTextField: { props: ["modelValue"], template: "<input :value='modelValue' @input=\"$emit('update:modelValue', $event.target.value)\" />" },
        VList: { template: "<div><slot /></div>" },
        VBtn: { props: ["disabled", "loading"], template: "<button class='load-more' :disabled='disabled'><slot /></button>" },
        RecipeCardLineItem: { props: ["recipe"], template: "<button class='recipe' :data-id='recipe.id'>{{ recipe.name }}</button>" },
        AppLoader: true, VIcon: true, VChip: true, SearchFilter: true, BaseNoResultsAlert: true,
      },
    },
  });
}

beforeEach(() => mocks.fetchMore.mockReset());

describe("recipe selector pagination", () => {
  it("reaches every recipe beyond the first 40 without skips or duplicates", async () => {
    mocks.fetchMore.mockImplementation(async (page: number, perPage: number) => rows(1, 87).slice((page - 1) * perPage, page * perPage));
    const wrapper = render();
    await flushPromises();
    expect(wrapper.findAll(".recipe")).toHaveLength(40);
    await wrapper.get(".load-more").trigger("click");
    await flushPromises();
    expect(wrapper.findAll(".recipe")).toHaveLength(80);
    await wrapper.get(".load-more").trigger("click");
    await flushPromises();
    expect(wrapper.findAll(".recipe").map(row => row.attributes("data-id"))).toEqual(rows(1, 87).map(row => row.id));
    expect(wrapper.find(".load-more").exists()).toBe(false);
    expect(mocks.fetchMore.mock.calls.map(args => args.slice(0, 2))).toEqual([[1, 40], [2, 40], [3, 40]]);
    await wrapper.findAll(".recipe")[86]!.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]?.[0]).toMatchObject({ id: "87" });
    wrapper.unmount();
  });

  it("restarts pagination when search or meal rules change and ignores stale page results", async () => {
    let finish!: (result: ReturnType<typeof rows>) => void;
    mocks.fetchMore.mockResolvedValueOnce(rows(1, 40))
      .mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }))
      .mockResolvedValueOnce(rows(100, 3))
      .mockResolvedValueOnce(rows(200, 2));
    const wrapper = render();
    await flushPromises();
    await wrapper.get(".load-more").trigger("click");
    expect(wrapper.get(".load-more").attributes("disabled")).toBeDefined();
    await wrapper.get("input").setValue("Soup");
    await flushPromises();
    finish(rows(41, 40));
    await flushPromises();
    expect(wrapper.findAll(".recipe").map(row => row.attributes("data-id"))).toEqual(["100", "101", "102"]);
    await wrapper.setProps({ queryFilter: "tags.id IN [dinner]" });
    await flushPromises();
    expect(wrapper.findAll(".recipe").map(row => row.attributes("data-id"))).toEqual(["200", "201"]);
    expect(mocks.fetchMore.mock.calls[2]?.[0]).toBe(1);
    expect(mocks.fetchMore.mock.calls[3]?.[6]).toBe("tags.id IN [dinner]");
    wrapper.unmount();
  });
});
