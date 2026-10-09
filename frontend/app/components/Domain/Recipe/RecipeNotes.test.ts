import { flushPromises, mount } from "@vue/test-utils";
import { reactive } from "vue";
import { afterEach, describe, expect, test, vi } from "vitest";
import RecipeNotes from "./RecipeNotes.vue";

const mocks = vi.hoisted(() => ({ createAsset: vi.fn(), error: vi.fn() }));
vi.mock("~/composables/api", () => ({
  useUserApi: () => ({ recipes: { createAsset: mocks.createAsset } }),
  useStaticRoutes: () => ({ recipeAssetPath: (id: string, file: string) => `/api/media/recipes/${id}/assets/${file}` }),
}));
vi.mock("~/composables/use-toast", () => ({ alert: { error: mocks.error } }));

function setup() {
  const notes = reactive([{ title: "Tip", text: "**Rest** for 10 minutes", referenceId: "note-1" }]);
  const wrapper = mount(RecipeNotes, {
    props: { modelValue: notes, assets: [], slug: "recipe", recipeId: "recipe-id" },
    global: {
      mocks: { $globals: { icons: {} } },
      stubs: {
        VCard: { template: "<div><slot /></div>" }, VCardText: { template: "<div><slot /></div>" },
        VBtn: { template: "<button><slot /></button>" }, VIcon: true, VTextField: true,
        VTextarea: { props: ["modelValue"], template: "<textarea :value=\"modelValue\" />" },
        SafeMarkdown: { props: ["source"], template: "<div class=\"markdown\">{{ source }}</div>" },
      },
    },
  });
  return { wrapper, notes };
}

afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); });

describe("RecipeNotes", () => {
  test("switches preview/source without losing text", async () => {
    const { wrapper, notes } = setup();
    await wrapper.findAll("button")[0]!.trigger("click");
    expect(wrapper.get(".markdown").text()).toBe(notes[0]!.text);
    expect(wrapper.find("textarea").exists()).toBe(false);
    await wrapper.findAll("button")[0]!.trigger("click");
    expect((wrapper.get("textarea").element as HTMLTextAreaElement).value).toBe(notes[0]!.text);
    wrapper.unmount();
  });

  test.each([true, false])("image upload success=%s preserves text and handles assets/errors", async (success) => {
    const { wrapper, notes } = setup();
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    const asset = { name: "photo", fileName: "photo.png", icon: "mdi-file-image" };
    mocks.createAsset.mockResolvedValueOnce({ data: success ? asset : null });
    await wrapper.findAll("button")[1]!.trigger("click");
    const picker = clickSpy.mock.contexts[0] as HTMLInputElement;
    Object.defineProperty(picker!, "files", { value: [new File(["image"], "photo.png", { type: "image/png" })] });
    picker!.dispatchEvent(new Event("change"));
    await flushPromises();
    expect(mocks.createAsset).toHaveBeenCalledOnce();
    if (success) {
      expect(notes[0]!.text).toContain("**Rest** for 10 minutes\n\n![](/api/media/recipes/recipe-id/assets/photo.png)");
      expect(wrapper.emitted("update:assets")).toEqual([[[asset]]]);
    }
    else {
      expect(notes[0]!.text).toBe("**Rest** for 10 minutes");
      expect(wrapper.emitted("update:assets")).toBeUndefined();
      expect(mocks.error).toHaveBeenCalledOnce();
    }
    wrapper.unmount();
  });
});
