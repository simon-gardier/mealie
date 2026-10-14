import { flushPromises, mount } from "@vue/test-utils";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "~/tests/setup";
import UrlCreate from "./url.vue";
import AiCreate from "./ai.vue";
import HtmlCreate from "./html.vue";
import NameCreate from "./new.vue";
import ZipCreate from "./zip.vue";
import BulkCreate from "./bulk.vue";

const mocks = vi.hoisted(() => ({
  recipes: {
    createOneByUrl: vi.fn(), createOneWithAI: vi.fn(), createOneByHtmlOrJson: vi.fn(),
    createOne: vi.fn(), createManyByUrl: vi.fn(),
  },
  upload: { file: vi.fn() },
  groupReports: { getAll: vi.fn() },
  navigate: vi.fn(),
}));
const recipeUrl = ref<string | null>("https://example.com/soup");

vi.mock("~/composables/api", () => ({ useUserApi: () => mocks }));
vi.mock("~/composables/use-recipe-import-url", () => ({ useRecipeImportUrl: () => recipeUrl }));
vi.mock("~/composables/use-groups", () => ({ useGroupSelf: () => ({ group: ref({ aiProviderSettings: { aiEnabled: true } }) }) }));
vi.mock("~/composables/store/use-tag-store", () => ({ useTagStore: () => ({ actions: { refresh: vi.fn() } }) }));
vi.mock("~/composables/use-validators", () => ({ validators: { required: () => true, url: () => true, urlOptional: () => true } }));
vi.mock("~/composables/use-global-i18n", () => ({ useGlobalI18n: () => i18n.global }));
vi.mock("~/composables/use-toast", () => ({ alert: { success: vi.fn(), error: vi.fn() } }));
vi.mock("~/composables/use-new-recipe-options", () => ({
  useNewRecipeOptions: () => ({
    importKeywordsAsTags: ref(false), importCategories: ref(false), stayInEditMode: ref(false),
    parseRecipe: ref(false), translateRecipe: ref(false), navigateToRecipe: mocks.navigate,
  }),
}));

const modes = [
  { name: "URL", component: UrlCreate, request: mocks.recipes.createOneByUrl },
  { name: "AI", component: AiCreate, request: mocks.recipes.createOneWithAI },
  { name: "raw data", component: HtmlCreate, request: mocks.recipes.createOneByHtmlOrJson },
  { name: "name", component: NameCreate, request: mocks.recipes.createOne },
  { name: "ZIP", component: ZipCreate, request: mocks.upload.file },
  { name: "bulk", component: BulkCreate, request: mocks.recipes.createManyByUrl },
];

function setup(mode: typeof modes[number]) {
  const container = { template: "<div><slot /></div>" };
  const button = { props: ["text", "disabled", "loading", "icon"], template: "<button :disabled=\"disabled\" :data-loading=\"loading\" :data-icon=\"icon\">{{ text }}<slot /><slot name=\"icon\" /></button>" };
  return mount(mode.component, {
    global: {
      mocks: { $globals: { icons: { robot: "robot-error-icon", autoFix: "auto-fix" } } },
      stubs: {
        "VForm": { methods: { validate: async () => ({ valid: true }) }, template: "<form><slot /></form>" },
        "VTextField": { props: ["modelValue"], template: "<input :value=\"modelValue\" @input=\"$emit('update:modelValue', $event.target.value)\" />" },
        "VTextarea": { props: ["modelValue"], template: "<textarea :value=\"modelValue\" @input=\"$emit('update:modelValue', $event.target.value)\" />" },
        "VFileInput": { name: "FileInput", props: ["modelValue"], template: "<input type=\"file\" />" },
        "BaseDialog": {
          props: ["modelValue", "title", "cancelText"], emits: ["update:modelValue"],
          template: "<section v-if=\"modelValue\" role=\"dialog\"><h2>{{ title }}</h2><slot /><button class=\"close-error\" @click=\"$emit('update:modelValue', false)\">{{ cancelText }}</button></section>",
        },
        "BaseButton": button, "VBtn": button,
        "VCardTitle": container, "VCardText": container, "VCardActions": container, "VCard": container,
        "VAlert": container, "VMenu": container, "VTabs": container, "VTab": container,
        "VRow": container, "VCol": container, "router-link": container,
        "VCheckbox": true, "VSwitch": true, "VIcon": true, "VDivider": true, "VSpacer": true,
        "BaseEmptyState": true, "BaseCardSectionTitle": true, "RecipeOrganizerSelector": true,
        "RecipeDialogBulkAdd": true, "ReportTable": true, "RecipeJsonEditor": true, "RecipeImportImages": true,
      },
    },
  });
}

type PageWrapper = ReturnType<typeof setup>;

async function prepare(wrapper: PageWrapper, mode: typeof modes[number]) {
  if (mode.name === "raw data") await wrapper.get("textarea").setValue("Soup recipe text");
  if (mode.name === "name") await wrapper.get("input").setValue("Soup");
  if (mode.name === "ZIP") {
    wrapper.findComponent({ name: "FileInput" }).vm.$emit("update:modelValue", new File(["zip"], "recipes.zip"));
    await flushPromises();
  }
}

async function submit(wrapper: PageWrapper, mode: typeof modes[number]) {
  if (["URL", "AI", "raw data"].includes(mode.name)) await wrapper.get("form").trigger("submit");
  else if (mode.name === "bulk") await wrapper.get(".bulk-submit-wrapper button").trigger("click");
  else await wrapper.get("button").trigger("click");
  await flushPromises();
}

describe("recipe creation error modals", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    recipeUrl.value = "https://example.com/soup";
    mocks.groupReports.getAll.mockResolvedValue({ data: [] });
    vi.stubGlobal("ref", ref);
    vi.stubGlobal("reactive", reactive);
    vi.stubGlobal("computed", computed);
    vi.stubGlobal("watch", watch);
    vi.stubGlobal("onMounted", onMounted);
    vi.stubGlobal("definePageMeta", vi.fn());
    vi.stubGlobal("useRoute", () => ({ params: { groupSlug: "family" }, query: {} }));
    vi.stubGlobal("useRouter", () => ({ push: mocks.navigate }));
    vi.stubGlobal("useMealieAuth", () => ({ user: ref({ groupSlug: "family" }) }));
    vi.stubGlobal("useI18n", () => ({ t: i18n.global.t, locale: ref("en-US") }));
  });

  it.each(modes.filter(mode => mode.name !== "ZIP"))("shows returned website errors in a dismissible $name modal without a robot", async (mode) => {
    mode.request.mockResolvedValue({ response: null, data: null, error: new Error("Website not accessible") });
    const wrapper = setup(mode);
    await prepare(wrapper, mode);
    expect(wrapper.find("[role=\"dialog\"]").exists()).toBe(false);
    await submit(wrapper, mode);
    expect(wrapper.get("[role=\"dialog\"]").text()).toContain("Website not accessible");
    expect(wrapper.get("[role=\"dialog\"]").html()).not.toContain("robot-error-icon");
    expect(mocks.navigate).not.toHaveBeenCalled();
    await wrapper.get(".close-error").trigger("click");
    expect(wrapper.find("[role=\"dialog\"]").exists()).toBe(false);
    await submit(wrapper, mode);
    expect(mode.request).toHaveBeenCalledTimes(2);
    expect(mode.request.mock.calls[1]?.[0]).toEqual(mode.request.mock.calls[0]?.[0]);
    wrapper.unmount();
  });

  it.each(modes)("shows rejected requests and releases the $name loading state for retry", async (mode) => {
    mode.request.mockRejectedValue(new Error("Backend is not responding"));
    const wrapper = setup(mode);
    await prepare(wrapper, mode);
    await submit(wrapper, mode);
    expect(wrapper.get("[role=\"dialog\"]").text()).toContain("Backend is not responding");
    expect(wrapper.find("[data-loading=\"true\"]").exists()).toBe(false);
    await wrapper.get(".close-error").trigger("click");
    mode.request.mockResolvedValue({ response: { status: mode.name === "bulk" ? 202 : 201, data: "soup" }, data: "soup", error: null, status: 201 });
    await submit(wrapper, mode);
    expect(mode.request).toHaveBeenCalledTimes(2);
    expect(wrapper.find("[role=\"dialog\"]").exists()).toBe(false);
    wrapper.unmount();
  });
});
