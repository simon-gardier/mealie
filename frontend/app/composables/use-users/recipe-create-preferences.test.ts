import { effectScope, nextTick } from "vue";
import { beforeEach, describe, expect, it } from "vitest";
import { useRecipeCreatePreferences } from "./preferences";

const key = "petit-chef-recipe-create-preferences";
beforeEach(() => localStorage.removeItem(key));

describe("automatic recipe organizers", () => {
  it("defaults all automatic keyword/category creation options to off", () => {
    const scope = effectScope();
    const preferences = scope.run(() => useRecipeCreatePreferences())!;
    expect(preferences.value).toMatchObject({ importKeywordsAsTags: false, importCategories: false, createNewOrganizers: false });
    scope.stop();
  });

  it("updates legacy defaults once, preserving other choices and later opt-ins", async () => {
    localStorage.setItem(key, JSON.stringify({ importKeywordsAsTags: true, importCategories: true, createNewOrganizers: true, stayInEditMode: false, parseRecipe: false, translateRecipe: false }));
    const scope = effectScope();
    const preferences = scope.run(() => useRecipeCreatePreferences())!;
    expect(preferences.value).toMatchObject({ importKeywordsAsTags: false, importCategories: false, createNewOrganizers: false, stayInEditMode: false, parseRecipe: false, translateRecipe: false });
    preferences.value.importKeywordsAsTags = true;
    await nextTick();
    scope.stop();
    const nextScope = effectScope();
    expect(nextScope.run(() => useRecipeCreatePreferences())!.value.importKeywordsAsTags).toBe(true);
    nextScope.stop();
  });
});
