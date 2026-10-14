import type { Recipe } from "~/lib/api/types/recipe";

export type RecipeSaveWarningCode = "empty-ingredients" | "unparsed-ingredients" | "note-only-substitutes"
  | "missing-category" | "missing-tags" | "excess-categories" | "excess-tags" | "no-steps" | "missing-yield" | "missing-time";

export interface RecipeSaveWarning {
  code: RecipeSaveWarningCode;
  count: number;
  ingredients?: number[];
  substitutes?: { ingredient: number; substitute: number }[];
}

const hasText = (text?: string | null) => !!text?.trim();
const positive = (value?: number) => typeof value === "number" && Number.isFinite(value) && value > 0;
function hasTime(text?: string | null): boolean {
  if (!hasText(text)) return false;
  const numbers = text!.match(/\d+(?:[.,]\d+)?/g);
  return !numbers || numbers.some(number => Number(number.replace(",", ".")) > 0);
}

/** Advisory checks only: preserve the draft and never rewrite recipe data. */
export function recipeSaveWarnings(recipe: Recipe, scope: "recipe" | "ingredients" = "recipe"): RecipeSaveWarning[] {
  const warnings: RecipeSaveWarning[] = [];
  const empty: number[] = [];
  const unparsed: number[] = [];
  const substitutes: { ingredient: number; substitute: number }[] = [];
  const ingredients = recipe.recipeIngredient ?? [];
  ingredients.forEach((ingredient, index) => {
    const hasFood = hasText(ingredient.food?.name) || !!ingredient.referencedRecipe;
    if (!hasFood) {
      if (hasText(ingredient.note) || hasText(ingredient.originalText)) unparsed.push(index + 1);
      else empty.push(index + 1);
    }
    ingredient.substitutions?.forEach((substitute, substituteIndex) => {
      if (hasText(substitute.note) && !substitute.substituteFoodId && !substitute.substituteFood?.id) {
        substitutes.push({ ingredient: index + 1, substitute: substituteIndex + 1 });
      }
    });
  });
  if (!ingredients.length || empty.length) warnings.push({ code: "empty-ingredients", count: empty.length, ingredients: empty });
  if (unparsed.length) warnings.push({ code: "unparsed-ingredients", count: unparsed.length, ingredients: unparsed });
  if (substitutes.length) warnings.push({ code: "note-only-substitutes", count: substitutes.length, substitutes });
  if (scope === "ingredients") return warnings;
  if (!recipe.recipeCategory?.length) warnings.push({ code: "missing-category", count: 0 });
  if (!recipe.tags?.length) warnings.push({ code: "missing-tags", count: 0 });
  if ((recipe.recipeCategory?.length ?? 0) > 3) warnings.push({ code: "excess-categories", count: recipe.recipeCategory!.length });
  if ((recipe.tags?.length ?? 0) > 5) warnings.push({ code: "excess-tags", count: recipe.tags!.length });
  if (!recipe.recipeInstructions?.some(step => hasText(step.text))) warnings.push({ code: "no-steps", count: 0 });
  if (!positive(recipe.recipeServings) && !positive(recipe.recipeYieldQuantity)) warnings.push({ code: "missing-yield", count: 0 });
  if (!hasTime(recipe.totalTime) && !(hasTime(recipe.prepTime) && (hasTime(recipe.performTime) || hasTime(recipe.cookTime)))) {
    warnings.push({ code: "missing-time", count: 0 });
  }
  return warnings;
}
