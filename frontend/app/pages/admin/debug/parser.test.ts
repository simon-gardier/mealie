import { flushPromises, shallowMount } from "@vue/test-utils";
import { afterEach, expect, test, vi } from "vitest";
import Parser from "./parser.vue";

const mocks = vi.hoisted(() => ({ parse: vi.fn(), error: vi.fn() }));
vi.mock("~/composables/api", () => ({ useUserApi: () => ({ recipes: { parseIngredient: mocks.parse } }) }));
vi.mock("~/composables/use-toast", () => ({ alert: { error: mocks.error } }));
function setup() {
  vi.stubGlobal("definePageMeta", vi.fn());
  vi.stubGlobal("useSeoMeta", vi.fn());
  return shallowMount(Parser, { global: {
    renderStubDefaultSlot: true,
    mocks: { $globals: { icons: {} } },
    stubs: { VTextField: { name: "VTextField", template: "<input />" }, VBtnToggle: { name: "VBtnToggle", template: "<div><slot /></div>" }, VContainer: true, VCard: true, VCardText: true, VCardActions: true, VCardTitle: true, VBtn: true, VSpacer: true, VCheckbox: true, VChip: true, BaseCardSectionTitle: true, BaseButton: { template: "<button><slot /></button>" } },
  } });
}
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
const result = { ingredient: { quantity: 2, food: { name: "milk" } }, confidence: { average: 0.8, quantity: 0.9 } };

test("clears confidence for changed input and for a response without confidence", async () => {
  const wrapper = setup();
  await wrapper.findComponent({ name: "VTextField" }).vm.$emit("update:modelValue", "milk");
  mocks.parse.mockResolvedValueOnce({ data: result });
  await wrapper.get("button").trigger("click");
  await flushPromises();
  expect(wrapper.find(".parser-overall-confidence").exists()).toBe(true);
  wrapper.findComponent({ name: "VTextField" }).vm.$emit("update:modelValue", "water");
  await flushPromises();
  expect(wrapper.find(".parser-overall-confidence").exists()).toBe(false);
  mocks.parse.mockResolvedValueOnce({ data: { ingredient: result.ingredient } });
  await wrapper.get("button").trigger("click");
  await flushPromises();
  expect(wrapper.find(".parser-overall-confidence").exists()).toBe(false);
  wrapper.unmount();
});

test("ignores an in-flight result after selecting another analyzer", async () => {
  const wrapper = setup();
  wrapper.findComponent({ name: "VTextField" }).vm.$emit("update:modelValue", "milk");
  await flushPromises();
  let finish!: (value: unknown) => void;
  mocks.parse.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
  await wrapper.get("button").trigger("click");
  wrapper.findComponent({ name: "VBtnToggle" }).vm.$emit("update:modelValue", "openai");
  finish({ data: result });
  await flushPromises();
  expect(mocks.parse).toHaveBeenCalledTimes(1);
  expect(wrapper.find(".parser-overall-confidence").exists()).toBe(false);
  expect(wrapper.find(".parser-result-grid").exists()).toBe(false);
  wrapper.unmount();
});
