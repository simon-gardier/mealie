import { shallowMount, flushPromises } from "@vue/test-utils";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import RecipeImageUploadBtn from "./RecipeImageUploadBtn.vue";

const { updateImage, reportError } = vi.hoisted(() => ({
  updateImage: vi.fn(),
  reportError: vi.fn(),
}));
vi.mock("~/composables/api", () => ({ useUserApi: () => ({ recipes: { updateImage } }) }));
vi.mock("~/composables/use-toast", () => ({ alertUnreportedError: reportError, alert: { error: reportError } }));

function mountEditor(imageUrl = "/api/media/recipes/id/images/original.webp") {
  return shallowMount(RecipeImageUploadBtn, {
    props: { slug: "soup", currentImageUrl: imageUrl },
    global: {
      mocks: { $globals: { icons: {} } },
      stubs: {
        VIcon: true,
        VBtn: { props: ["disabled"], template: "<button :disabled=\"disabled\"><slot /></button>" },
        VTextField: true,
        AppButtonUpload: true,
        BaseDialog: { props: ["modelValue"], template: "<div v-if=\"modelValue\"><slot /><slot name=\"card-actions\" /></div>" },
        BaseButton: { props: ["disabled"], template: "<button :disabled=\"disabled\"><slot /></button>" },
        VMenu: { template: "<div><slot /><slot name=\"card-actions\" /></div>" },
        VCard: { template: "<div><slot /><slot name=\"card-actions\" /></div>" },
        VCardTitle: { template: "<div><slot /><slot name=\"card-actions\" /></div>" },
        VCardText: { template: "<div><slot /><slot name=\"card-actions\" /></div>" },
        ImageCropper: { name: "ImageCropper", props: { img: String, submitted: Boolean, hideDelete: Boolean }, emits: ["save"], template: "<div />" },
      },
    },
  });
}

describe("current recipe image reframing", () => {
  afterEach(() => vi.unstubAllGlobals());
  beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:preview") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  });

  it("opens the existing image and uploads the cropped file before refreshing", async () => {
    updateImage.mockResolvedValue({ data: { image: "new-version" }, error: null });
    const wrapper = mountEditor();
    await wrapper.findAll("button").find(button => button.text().includes("Reframe"))!.trigger("click");
    const cropper = wrapper.findComponent({ name: "ImageCropper" });
    expect(cropper.props("img")).toContain("original.webp");
    expect(cropper.props("hideDelete")).toBe(true);
    expect(updateImage).not.toHaveBeenCalled();
    cropper.vm.$emit("save", new Blob(["cropped"], { type: "image/png" }));
    await flushPromises();
    expect(updateImage).toHaveBeenCalledWith("soup", expect.any(File));
    expect(updateImage.mock.calls[0][1].name).toBe("reframed-recipe.png");
    expect(wrapper.emitted("refresh")).toEqual([["new-version"]]);
    expect(wrapper.findComponent({ name: "ImageCropper" }).exists()).toBe(false);
  });

  it("keeps the crop editor open when saving fails", async () => {
    updateImage.mockRejectedValue(new Error("offline"));
    const wrapper = mountEditor();
    await wrapper.findAll("button").find(button => button.text().includes("Reframe"))!.trigger("click");
    wrapper.findComponent({ name: "ImageCropper" }).vm.$emit("save", new Blob());
    await flushPromises();
    expect(reportError).toHaveBeenCalled();
    expect(wrapper.emitted("refresh")).toBeUndefined();
    expect(wrapper.findComponent({ name: "ImageCropper" }).props("submitted")).toBe(false);
  });

  it("disables reframing when no current image exists", () => {
    const wrapper = mountEditor("");
    expect(wrapper.findAll("button").find(button => button.text().includes("Reframe"))!.attributes("disabled")).toBeDefined();
  });
  it("previews a file without replacing the image, and cancel discards it", async () => {
    const wrapper = mountEditor();
    const input = wrapper.find("input[type=\"file\"]");
    Object.defineProperty(input.element, "files", { value: [new File(["new"], "new.png", { type: "image/png" })] });
    await input.trigger("change");
    expect(wrapper.findComponent({ name: "ImageCropper" }).props("img")).toBe("blob:preview");
    expect(updateImage).not.toHaveBeenCalled();
    await wrapper.findAll("button").find(button => button.text() === "Cancel")!.trigger("click");
    expect(updateImage).not.toHaveBeenCalled();
    expect(wrapper.emitted("refresh")).toBeUndefined();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
    expect(wrapper.findComponent({ name: "ImageCropper" }).exists()).toBe(false);
  });

  it("uploads a staged file only after the crop editor saves", async () => {
    updateImage.mockResolvedValue({ data: { image: "import-version" }, error: null });
    const wrapper = mountEditor();
    const input = wrapper.find("input[type=\"file\"]");
    Object.defineProperty(input.element, "files", { value: [new File(["new"], "new.png", { type: "image/png" })] });
    await input.trigger("change");
    expect(updateImage).not.toHaveBeenCalled();
    wrapper.findComponent({ name: "ImageCropper" }).vm.$emit("save", new Blob(["cropped"], { type: "image/png" }));
    await flushPromises();
    expect(updateImage).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted("refresh")).toEqual([["import-version"]]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });
  it("previews a URL without updating the stored recipe image", async () => {
    const fetchImage = vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["remote"], { type: "image/png" }) });
    vi.stubGlobal("fetch", fetchImage);
    const wrapper = mountEditor();
    wrapper.findComponent({ name: "VTextField" }).vm.$emit("update:modelValue", "https://example.com/photo.png");
    await flushPromises();
    await wrapper.findAll("button").find(button => button.text() === "Preview image")!.trigger("click");
    await flushPromises();
    expect(fetchImage).toHaveBeenCalledWith("https://example.com/photo.png", { credentials: "omit" });
    expect(wrapper.findComponent({ name: "ImageCropper" }).props("img")).toBe("blob:preview");
    expect(updateImage).not.toHaveBeenCalled();
    expect(wrapper.emitted("refresh")).toBeUndefined();
  });

  it("keeps the previous image if a URL preview is blocked", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("CORS")));
    const wrapper = mountEditor();
    wrapper.findComponent({ name: "VTextField" }).vm.$emit("update:modelValue", "https://example.com/photo.png");
    await flushPromises();
    await wrapper.findAll("button").find(button => button.text() === "Preview image")!.trigger("click");
    await flushPromises();
    expect(reportError).toHaveBeenCalled();
    expect(updateImage).not.toHaveBeenCalled();
    expect(wrapper.findComponent({ name: "ImageCropper" }).exists()).toBe(false);
  });
});
