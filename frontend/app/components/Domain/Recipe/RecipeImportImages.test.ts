import { mount, flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RecipeImportImages from "./RecipeImportImages.vue";

vi.mock("~/composables/use-toast", () => ({ alert: { error: vi.fn() } }));

function setup(files: (Blob | File)[] = [], disabled = false) {
  const wrapper = mount(RecipeImportImages, {
    props: { "modelValue": files, disabled, "onUpdate:modelValue": value => wrapper.setProps({ modelValue: value }) },
    global: {
      mocks: { $globals: { icons: {} } },
      stubs: {
        VBtn: { props: ["disabled"], template: "<button :disabled=\"disabled\"><slot /></button>" },
        VSpacer: true,
        BaseDialog: { props: ["modelValue"], template: "<div v-if=\"modelValue\" class=\"dialog\"><slot /><slot name=\"card-actions\" /></div>" },
        ImageCropper: { name: "ImageCropper", props: ["img"], emits: ["save"], template: "<div class=\"cropper\" />" },
      },
    },
  });
  return wrapper;
}

describe("import image selection", () => {
  beforeEach(() => {
    let id = 0;
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => `blob:preview-${++id}`) });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  });

  it("previews selected files and leaves images unchanged when cropping is cancelled", async () => {
    const original = new File(["original"], "recipe.png", { type: "image/png" });
    const wrapper = setup();
    const input = wrapper.get("input");
    Object.defineProperty(input.element, "files", { value: [original] });
    await input.trigger("change");
    await flushPromises();
    expect(wrapper.findAll(".import-image-preview")).toHaveLength(1);
    expect(wrapper.find(".cropper").exists()).toBe(false);
    await wrapper.get(".import-image-actions button").trigger("click");
    expect(wrapper.find(".cropper").exists()).toBe(true);
    const updates = wrapper.emitted("update:modelValue")?.length;
    await wrapper.get(".dialog button").trigger("click");
    expect(wrapper.find(".cropper").exists()).toBe(false);
    expect(wrapper.emitted("update:modelValue")).toHaveLength(updates!);
    expect(wrapper.props("modelValue")).toEqual([original]);
    wrapper.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
  });

  it("applies a crop only to its selected image, then supports cover ordering and removal", async () => {
    const first = new Blob(["first"]);
    const second = new Blob(["second"]);
    const cropped = new Blob(["cropped"]);
    const wrapper = setup([first, second]);
    const oldUrls = wrapper.findAll("img").map(image => image.attributes("src"));
    await wrapper.findAll(".import-image-card")[1]!.get("button").trigger("click");
    wrapper.findComponent({ name: "ImageCropper" }).vm.$emit("save", cropped);
    await flushPromises();
    expect(wrapper.props("modelValue")).toEqual([first, cropped]);
    expect(wrapper.find(".cropper").exists()).toBe(false);
    oldUrls.forEach(url => expect(URL.revokeObjectURL).toHaveBeenCalledWith(url));
    await wrapper.findAll(".import-image-card")[1]!.findAll("button")[2]!.trigger("click");
    await flushPromises();
    expect(wrapper.props("modelValue")).toEqual([cropped, first]);
    await wrapper.get(".import-image-card").findAll("button")[1]!.trigger("click");
    await flushPromises();
    expect(wrapper.props("modelValue")).toEqual([first]);
    wrapper.unmount();
  });

  it("disables image actions during import", () => {
    const wrapper = setup([new Blob(["image"])], true);
    expect(wrapper.get("input").attributes("disabled")).toBeDefined();
    wrapper.findAll("button").forEach(button => expect(button.attributes("disabled")).toBeDefined());
    wrapper.unmount();
  });
});
