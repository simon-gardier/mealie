import { inject, type InjectionKey, type Ref } from "vue";

export const recipeImportUrlKey: InjectionKey<Ref<string | null>> = Symbol("recipe-import-url");

export function readRecipeImportUrl(query: Record<string, unknown>): string | null {
  if (typeof query.recipe_import_url === "string" && query.recipe_import_url) {
    return query.recipe_import_url;
  }
  if (typeof query.recipe_import_text === "string") {
    try {
      const url = new URL(query.recipe_import_text);
      if (["http:", "https:"].includes(url.protocol)) return query.recipe_import_text;
    }
    catch { /* Shared text need not be a URL. */ }
  }
  return null;
}

export function useRecipeImportUrl() {
  const draft = inject(recipeImportUrlKey);
  if (!draft) throw new Error("Recipe URL draft requires the recipe creation page");
  return draft;
}
