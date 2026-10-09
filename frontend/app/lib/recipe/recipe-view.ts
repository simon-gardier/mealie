import type { Recipe } from "~/lib/api/types/recipe";

export type RecipeView = { [K in keyof Recipe]-?: NonNullable<Recipe[K]> };

/** Page collections and controls need defaults; nested API values remain untouched. */
export function recipeView(recipe: Recipe): RecipeView {
  return {
    id: "", userId: "", householdId: "", groupId: "", name: "", slug: "", image: "",
    recipeServings: 0, recipeYieldQuantity: 0, recipeYield: "", totalTime: "", prepTime: "",
    cookTime: "", performTime: "", description: "", recipeCategory: [], tags: [], tools: [],
    rating: 0, orgURL: "", dateAdded: "", dateUpdated: "", createdAt: "", updatedAt: "",
    lastMade: "", recipeIngredient: [], recipeInstructions: [], nutrition: {}, settings: {},
    assets: [], notes: [], extras: {}, comments: [],
    ...Object.fromEntries(Object.entries(recipe).filter(([, value]) => value != null)),
  };
}
