import { describe, expect, it } from "vitest";
import { recipeImportErrorKey } from "./import-errors";

describe("recipe import errors", () => {
  it.each([401, 403])("explains session/access failures (%i)", (status) => {
    expect(recipeImportErrorKey({ status, message: "Not authenticated" })).toBe("recipe.url-import-error-session");
  });
  it("distinguishes a lost connection from missing recipe data", () => {
    expect(recipeImportErrorKey(new Error("Recipe creation failed"))).toBe("recipe.url-import-error-connection");
    expect(recipeImportErrorKey(new Error("BAD_RECIPE_DATA"))).toBe("recipe.url-import-error-source");
  });
  it("preserves meaningful backend messages", () => {
    expect(recipeImportErrorKey(new Error("AI provider is unavailable"))).toBeUndefined();
  });
});
