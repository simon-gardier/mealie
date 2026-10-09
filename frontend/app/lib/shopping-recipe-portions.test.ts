import { describe, expect, test } from "vitest";
import { setShoppingRecipePortions, type ShoppingRecipePortions } from "./shopping-recipe-portions";

function section(recipeId: string, basePortions = 4, recipeScale = 1, parentId?: string): ShoppingRecipePortions {
  return { recipeId, basePortions, recipeScale, desiredPortions: basePortions * recipeScale,
    parentRecipe: parentId ? { id: parentId } : undefined };
}

describe("shopping recipe portions", () => {
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
