import { useIngredientTextParser } from "~/composables/recipes/use-recipe-ingredients";
import { setShoppingRecipePortions } from "./shopping-recipe-portions";
import { expect, test, vi } from "vitest";
import { shoppingIngredientWithQuantity } from "./shopping-ingredient-quantity";

test.each([
  ["3 poireaux de belle taille", 3, "poireaux de belle taille"],
  ["4 louches de riz pour risotto", 4, "louches de riz pour risotto"],
  ["4,5 cl de nuoc mam", 4.5, "cl de nuoc mam"],
  ["1/2 cube de bouillon", 0.5, "cube de bouillon"],
  ["1 1/2 verre de vin", 1.5, "verre de vin"],
])("extracts the explicit amount from %s without mutating the recipe", (text, quantity, note) => {
  const ingredient = { quantity: 1, note: text, originalText: text };
  expect(shoppingIngredientWithQuantity(ingredient)).toMatchObject({ quantity, note, originalText: null });
  expect(ingredient.originalText).toBe(text);
});

test.each(["beurre", "parmesan râpé", "1 à 2 cubes", "1/0 cube"])("does not invent an amount for %s", (text) => {
  const ingredient = { originalText: text };
  expect(shoppingIngredientWithQuantity(ingredient)).toBe(ingredient);
});

vi.mock("~/composables/use-locales", () => ({ useLocales: () => ({ locale: { value: "fr-FR", pluralFoodHandling: "always" }, locales: [] }) }));

test("changing portions updates the displayed text and API multiplier for an unresolved ingredient", () => {
  const ingredient = shoppingIngredientWithQuantity({ quantity: 1, originalText: "3 poireaux de belle taille" });
  const section = { recipeId: "risotto", basePortions: 4, desiredPortions: 4, recipeScale: 1 };
  const { parseIngredientText } = useIngredientTextParser();
  expect(parseIngredientText(ingredient, section.recipeScale, false)).toBe("3 poireaux de belle taille");
  setShoppingRecipePortions([section], section, 8);
  expect(parseIngredientText(ingredient, section.recipeScale, false)).toBe("6 poireaux de belle taille");
  expect(ingredient.quantity! * section.recipeScale).toBe(6);
});
