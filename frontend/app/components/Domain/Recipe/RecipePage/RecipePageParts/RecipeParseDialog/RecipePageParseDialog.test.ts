import { shallowMount } from "@vue/test-utils";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { reactive, ref } from "vue";
import RecipePageParseDialog from "./RecipePageParseDialog.vue";

const mocks = vi.hoisted(() => ({ next: vi.fn(), previous: vi.fn(), save: vi.fn(), remove: vi.fn(), state: { step: 2, reviewedCount: 0, reviewTotal: 3, saveLoading: false, loading: { unit: false, food: false } } }));
vi.mock("~/composables/recipes/use-parse-ingredients-dialog", () => ({
  ParseStep: { LOADING: 0, INFO: 1, PARSE: 2, REVIEW: 3 },
  useParseIngredientsDialog: () => ({
    state: reactive(mocks.state), parser: ref("brute"), parserPreferences: ref({ parser: "brute" }),
    dontShowInfoPage: ref(false), parsedIngs: ref([]), currentIng: ref({ input: "milk", ingredient: {} }),
    autoParsedIngredientsCount: ref(0), ingredientsToReviewCount: ref(3), nextStep: vi.fn(),
    saveIngs: mocks.save, nextIngredient: mocks.next, previousIngredient: mocks.previous,
    canGoToPreviousIngredient: ref(true), parseIngredients: vi.fn(), undoRemoveIngredient: vi.fn(),
    canUndoRemoveIngredient: ref(false), removeCurrentIngredient: mocks.remove,
  }),
}));
function mountDialog(mobile = false) {
  return shallowMount(RecipePageParseDialog, {
    props: { modelValue: true, ingredients: [] },
    global: {
      mocks: { $vuetify: { display: { xs: mobile } }, $globals: { icons: { arrowLeftBold: "", arrowRightBold: "" } } },
      stubs: {
        BaseDialog: { template: "<div><header><slot name=\"header\" /></header><main><slot /></main><footer><slot name=\"card-actions\" /></footer></div>" },
        VBtn: { props: ["disabled"], template: "<button :disabled=\"disabled\"><slot /></button>" },
        VProgressLinear: { name: "VProgressLinear", props: ["modelValue", "max", "bgColor", "bgOpacity"], template: "<div />" },
        VMenu: { template: "<div><slot name=\"activator\" :props=\"{}\" /><slot /></div>" }, VCard: { template: "<div><slot /></div>" }, VIcon: true, ParseDialogParse: true, ParseDialogReview: true, ParseDialogInfo: true, VProgressCircular: true,
      },
    },
  });
}
describe("ingredient analysis sheet", () => {
  test.each([false, true])("keeps removal accessible in the footer (mobile: %s)", async (mobile) => {
    const wrapper = mountDialog(mobile);
    const remove = wrapper.find("footer .analysis-remove");
    expect(remove.attributes("aria-label")).toBeTruthy();
    expect(remove.find("span").exists()).toBe(!mobile);
    await remove.trigger("click");
    expect(mocks.remove).toHaveBeenCalledOnce();
    mocks.state.loading.food = true;
    const busyWrapper = mountDialog(mobile);
    expect(busyWrapper.find("footer .analysis-remove").attributes("disabled")).toBeDefined();
  });
  beforeEach(() => {
    mocks.state.step = 2;
    mocks.state.reviewedCount = 0;
    mocks.state.loading.food = false;
    vi.clearAllMocks();
  });
  test("shows ingredient position in the header without a progress bar", () => {
    const wrapper = mountDialog();
    expect(wrapper.find("h2").text()).toBe("Parse ingredients");
    const progress = wrapper.findComponent({ name: "VProgressLinear" });
    expect(progress.exists()).toBe(false);
    expect(wrapper.find("header .analysis-count").text()).toBe("1 / 3");
    expect(wrapper.find("header .analysis-count").attributes("aria-label")).toBe("Ingredient 1 of 3");
  });
  test("names the transition to the final review and wires it to the existing navigation", async () => {
    mocks.state.reviewedCount = 2;
    const wrapper = mountDialog();
    const next = wrapper.findAll("button").find(button => button.text() === "Review all")!;
    await next.trigger("click");
    expect(mocks.next).toHaveBeenCalledOnce();
  });
  test("labels the final action Apply to recipe and saves only when pressed", async () => {
    mocks.state.step = 3;
    const wrapper = mountDialog();
    expect(wrapper.find("h2").text()).toBe("Final review");
    expect(mocks.save).not.toHaveBeenCalled();
    await wrapper.findAll("button").find(button => button.text() === "Apply to recipe")!.trigger("click");
    expect(mocks.save).toHaveBeenCalledOnce();
  });
});
