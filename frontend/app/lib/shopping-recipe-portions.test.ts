import { describe, expect, test } from "vitest";
import { canScaleShoppingRecipe, setShoppingRecipePortions, type ShoppingRecipePortions } from "./shopping-recipe-portions";
import type { RecipeIngredient } from "~/lib/api/types/household";

function section(recipeId: string, basePortions = 4, recipeScale = 1, parentId?: string): ShoppingRecipePortions {
  return { recipeId, basePortions, recipeScale, desiredPortions: basePortions * recipeScale,
    parentRecipe: parentId ? { id: parentId } : undefined };
}

describe("shopping recipe portions", () => {
  test("rejects circular subrecipe references without recursing forever", () => {
    const ingredients: RecipeIngredient[] = [];
    ingredients.push({ referencedRecipe: { recipeIngredient: ingredients } } as RecipeIngredient);
    expect(canScaleShoppingRecipe(ingredients)).toBe(false);
  });
  test("requires recognized foods throughout the recipe and linked recipes", () => {
    const recognized = { food: { name: "Milk" } } as RecipeIngredient;
    const unresolved = { originalText: "2 eggs" } as RecipeIngredient;
    expect(canScaleShoppingRecipe(undefined)).toBe(false);
    expect(canScaleShoppingRecipe([])).toBe(false);
    expect(canScaleShoppingRecipe([recognized])).toBe(true);
    expect(canScaleShoppingRecipe([recognized, unresolved])).toBe(false);
    expect(canScaleShoppingRecipe([{ referencedRecipe: { recipeIngredient: [unresolved] } } as RecipeIngredient])).toBe(false);
    expect(canScaleShoppingRecipe([{ referencedRecipe: { recipeIngredient: [recognized] } } as RecipeIngredient])).toBe(true);
  });

  test("rejects changes to unanalyzed recipes and leaves locked children unchanged", () => {
    const main = { ...section("main"), canScale: false };
    const child = { ...section("child", 2, 1, "main"), canScale: false };
    setShoppingRecipePortions([main, child], main, 8);
    expect(main.desiredPortions).toBe(4);
    expect(main.recipeScale).toBe(1);
    main.canScale = true;
    setShoppingRecipePortions([main, child], main, 8);
    expect(child.recipeScale).toBe(1);
    expect(child.desiredPortions).toBe(2);
  });
  test("converts desired portions to the API multiplier, including fractional portions", () => {
    const recipe = section("main", 4, 2);
    setShoppingRecipePortions([recipe], recipe, 3);
    expect(recipe.recipeScale).toBe(0.75);
    expect(recipe.desiredPortions).toBe(3);
  });

  test("scales nested recipes while leaving unrelated recipes untouched", () => {
    const main = section("main");
    const child = section("sauce", 2, 0.5, "main");
    const nested = section("stock", 1, 3, "sauce");
    const other = section("other");
    setShoppingRecipePortions([main, child, nested, other], main, 8);
    expect([main.recipeScale, child.recipeScale, nested.recipeScale, other.recipeScale]).toEqual([2, 1, 6, 1]);
    expect(child.desiredPortions).toBe(2);
    expect(nested.desiredPortions).toBe(6);
  });

  test.each([null, 0, -1, NaN])("retains scale for invalid input %s and recovers when corrected", (value) => {
    const recipe = section("main");
    setShoppingRecipePortions([recipe], recipe, value);
    expect(recipe.recipeScale).toBe(1);
    setShoppingRecipePortions([recipe], recipe, 6);
    expect(recipe.recipeScale).toBe(1.5);
  });
});
