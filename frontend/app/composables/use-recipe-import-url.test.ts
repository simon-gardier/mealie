import { mount } from "@vue/test-utils";
import { defineComponent, h, provide, ref } from "vue";
import { describe, expect, test } from "vitest";
import { readRecipeImportUrl, recipeImportUrlKey, useRecipeImportUrl } from "./use-recipe-import-url";

describe("recipe creation URL draft", () => {
  test("preserves edits across modes, including a mode without a URL field, and respects clearing", async () => {
    const mode = ref("url");
    const InputMode = defineComponent({
      setup() {
        const url = useRecipeImportUrl();
        return () => h("input", {
          value: url.value || "",
          onInput: (event: Event) => { url.value = (event.target as HTMLInputElement).value || null; },
        });
      },
    });
    const Page = defineComponent({
      setup() {
        provide(recipeImportUrlKey, ref(readRecipeImportUrl({ recipe_import_url: "https://example.com/recipe" })));
        return () => mode.value === "new" ? h("div") : h(InputMode, { key: mode.value });
      },
    });
    const wrapper = mount(Page);
    expect((wrapper.get("input").element as HTMLInputElement).value).toBe("https://example.com/recipe");
    await wrapper.get("input").setValue("https://example.com/edited");
    mode.value = "new";
    await wrapper.vm.$nextTick();
    mode.value = "html";
    await wrapper.vm.$nextTick();
    expect((wrapper.get("input").element as HTMLInputElement).value).toBe("https://example.com/edited");
    await wrapper.get("input").setValue("");
    mode.value = "ai";
    await wrapper.vm.$nextTick();
    expect((wrapper.get("input").element as HTMLInputElement).value).toBe("");
    wrapper.unmount();
    const fresh = mount(Page);
    expect((fresh.get("input").element as HTMLInputElement).value).toBe("https://example.com/recipe");
    fresh.unmount();
  });

  test("accepts shared HTTP URLs and ignores arbitrary shared text", () => {
    expect(readRecipeImportUrl({ recipe_import_text: "https://example.com/recipe" })).toBe("https://example.com/recipe");
    expect(readRecipeImportUrl({ recipe_import_text: "Recipe notes" })).toBeNull();
    expect(readRecipeImportUrl({ recipe_import_text: "file:///recipe" })).toBeNull();
  });
});
