import type { RecipeIngredient } from "~/lib/api/types/household";

/** Extract only an explicit leading amount; do not guess units or food names. */
export function shoppingIngredientWithQuantity(ingredient: RecipeIngredient): RecipeIngredient {
  if (ingredient.food || ingredient.unit || ingredient.referencedRecipe) return ingredient;
  const text = (ingredient.originalText || ingredient.note || "").trim();
  const match = text.match(/^(\d+(?:[.,]\d+)?)(?:\s+(\d+)\/(\d+)|\/(\d+))?\s+(.+)$/s);
  if (!match) return ingredient;
  const note = match[5]!;
  // Ranges and alternatives need human review rather than a guessed amount.
  if (/^(?:à\s|to\s|ou\s|or\s|[-–—\d])/.test(note)) return ingredient;
  let quantity = Number(match[1]!.replace(",", "."));
  if (match[4]) quantity /= Number(match[4]);
  else if (match[2]) quantity += Number(match[2]) / Number(match[3]);
  if (!Number.isFinite(quantity) || quantity <= 0) return ingredient;
  return { ...ingredient, quantity, note, originalText: null };
}
