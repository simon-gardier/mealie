import { describe, expect, it } from "vitest";
import { recipeSaveWarnings } from "./save-warnings";
import type { Recipe } from "~/lib/api/types/recipe";

function complete(): Recipe {
  return {
    recipeIngredient: [{ quantity: 100, food: { name: "farine" } }],
    recipeInstructions: [{ text: "Mélanger." }], recipeServings: 4, totalTime: "20 minutes",
    recipeCategory: [{ id: "dinner", name: "Diner", slug: "diner" }],
    tags: [{ id: "french", name: "Cuisine Française", slug: "cuisine-francaise" }],
  };
}
const codes = (recipe: Recipe) => recipeSaveWarnings(recipe).map(issue => issue.code);

describe("recipe save warnings", () => {
  it("warns when categories or tags are absent", () => {
    expect(codes({ ...complete(), recipeCategory: [] })).toEqual(["missing-category"]);
    expect(codes({ ...complete(), tags: [] })).toEqual(["missing-tags"]);
    expect(codes({ ...complete(), recipeCategory: null, tags: null })).toEqual(["missing-category", "missing-tags"]);
  });
  it("does not interrupt complete recipes", () => {
    expect(recipeSaveWarnings(complete())).toEqual([]);
  });
  it("only reviews ingredients and substitutes when applying analyzed ingredients", () => {
    const recipe: Recipe = {
      recipeIngredient: [{}, { originalText: "Salt to taste" }, {
        food: { name: "flour" }, substitutions: [{ note: "Or butter" }],
      }],
    };
    const ingredientWarnings = [
      { code: "empty-ingredients", count: 1, ingredients: [1] },
      { code: "unparsed-ingredients", count: 1, ingredients: [2] },
      { code: "note-only-substitutes", count: 1, substitutes: [{ ingredient: 3, substitute: 1 }] },
    ];
    expect(recipeSaveWarnings(recipe, "ingredients")).toEqual(ingredientWarnings);
    expect(recipeSaveWarnings(recipe)).toEqual([
      ...ingredientWarnings,
      { code: "missing-category", count: 0 },
      { code: "missing-tags", count: 0 },
      { code: "no-steps", count: 0 },
      { code: "missing-yield", count: 0 },
      { code: "missing-time", count: 0 },
    ]);
  });
  it("does not interrupt ingredient application for unrelated missing recipe details", () => {
    expect(recipeSaveWarnings({ recipeIngredient: complete().recipeIngredient }, "ingredients")).toEqual([]);
  });
  it("warns about an empty list and identifies blank rows without counting notes twice", () => {
    expect(codes({ ...complete(), recipeIngredient: [] })).toEqual(["empty-ingredients"]);
    const recipe = complete();
    recipe.recipeIngredient = [{ title: "Sauce", quantity: 1 }, { note: "Sel au goût" }, { food: { name: "farine" } }];
    expect(recipeSaveWarnings(recipe)).toEqual([
      { code: "empty-ingredients", count: 1, ingredients: [1] },
      { code: "unparsed-ingredients", count: 1, ingredients: [2] },
    ]);
  });
  it("preserves original unparsed text and recognizes linked subrecipes", () => {
    const recipe = { ...complete(), recipeIngredient: [{ originalText: "2 eggs" }, { referencedRecipe: { name: "Sauce" } }] };
    const before = JSON.stringify(recipe);
    expect(recipeSaveWarnings(recipe)).toEqual([{ code: "unparsed-ingredients", count: 1, ingredients: [1] }]);
    expect(JSON.stringify(recipe)).toBe(before);
  });
  it("identifies note-only substitutes but allows notes alongside a linked food", () => {
    const recipe = complete();
    recipe.recipeIngredient![0]!.substitutions = [{ note: "Or butter" }, { note: "Optional", substituteFoodId: "oil" }];
    expect(recipeSaveWarnings(recipe)).toEqual([
      { code: "note-only-substitutes", count: 1, substitutes: [{ ingredient: 1, substitute: 1 }] },
    ]);
  });
  it("warns about empty substitutes including blank remarks without flagging linked foods", () => {
    const recipe = complete();
    recipe.recipeIngredient![0]!.substitutions = [
      {}, { note: "" }, { note: "   " },
      { substituteFoodId: "oil" }, { substituteFood: { id: "butter", name: "butter" } },
    ];
    expect(recipeSaveWarnings(recipe, "ingredients")).toEqual([{
      code: "note-only-substitutes", count: 3,
      substitutes: [1, 2, 3].map(substitute => ({ ingredient: 1, substitute })),
    }]);
  });
  it("uses the requested category and tag thresholds", () => {
    const category = { id: "id", name: "Name", slug: "name" };
    const recipe = { ...complete(), recipeCategory: Array.from({ length: 3 }, () => category), tags: Array.from({ length: 5 }, () => category) };
    expect(recipeSaveWarnings(recipe)).toEqual([]);
    recipe.recipeCategory.push(category);
    recipe.tags.push(category);
    expect(codes(recipe)).toEqual(["excess-categories", "excess-tags"]);
  });
  it("requires instruction text, not just a step heading", () => {
    expect(codes({ ...complete(), recipeInstructions: [{ title: "Prep", text: "  " }] })).toEqual(["no-steps"]);
  });
  it("accepts either servings or a yield quantity", () => {
    expect(codes({ ...complete(), recipeServings: 0, recipeYieldQuantity: 1 })).toEqual([]);
    expect(codes({ ...complete(), recipeServings: 0, recipeYieldQuantity: 0, recipeYield: "loaves" })).toEqual(["missing-yield"]);
  });
  it("accepts total time or both preparation and cooking time", () => {
    expect(codes({ ...complete(), totalTime: "", prepTime: "10 minutes", performTime: "20 minutes" })).toEqual([]);
    expect(codes({ ...complete(), totalTime: "", prepTime: "10 minutes", cookTime: "20 minutes" })).toEqual([]);
    expect(codes({ ...complete(), totalTime: "", prepTime: "10 minutes" })).toEqual(["missing-time"]);
  });
  it.each(["0", "0 minutes", "PT0H0M0S"])("treats zero durations as missing (%s)", (totalTime) => {
    expect(codes({ ...complete(), totalTime })).toEqual(["missing-time"]);
  });
});
