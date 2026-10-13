import type { Recipe } from "~/lib/api/types/recipe";

type RecipeDate = "dateAdded" | "dateUpdated" | "createdAt" | "updatedAt" | "lastMade";
export type RecipeView = { [K in keyof Recipe]-?: K extends RecipeDate ? string | null : NonNullable<Recipe[K]> };

/** Page collections and controls need defaults; nested API values remain untouched. */
export function recipeView(recipe: Recipe): RecipeView {
  return {
    id: "", userId: "", householdId: "", groupId: "", name: "", slug: "", image: "",
    recipeServings: 0, recipeYieldQuantity: 0, recipeYield: "", totalTime: "", prepTime: "",
    cookTime: "", performTime: "", description: "", recipeCategory: [], tags: [], tools: [],
    rating: 0, orgURL: "", dateAdded: null, dateUpdated: null, createdAt: null, updatedAt: null,
    lastMade: null, recipeIngredient: [], recipeInstructions: [], nutrition: {}, settings: {},
    assets: [], notes: [], extras: {}, comments: [],
    ...Object.fromEntries(Object.entries(recipe).filter(([, value]) => value != null)),
  };
}

/** UI/JSON drafts can contain blank dates; the API expects a date or null. */
export function recipeSavePayload(recipe: Recipe): Recipe {
  const payload = { ...recipe };
  for (const key of ["dateAdded", "dateUpdated", "createdAt", "updatedAt", "lastMade"] as const) {
    if (typeof payload[key] === "string" && !payload[key].trim()) payload[key] = null;
  }
  return payload;
}
