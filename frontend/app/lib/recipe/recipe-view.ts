import type { RecipeDraft, RecipeOut } from "~/lib/api/types/recipe";

type RecipeDate = "dateAdded" | "dateUpdated" | "createdAt" | "updatedAt";
/** Structured times: null means "no time", which 0 would not express. */
type RecipeDuration = "totalTimeSeconds" | "prepTimeSeconds" | "performTimeSeconds";
type NullableKey = RecipeDate | RecipeDuration;

export type RecipeView = {
  [K in keyof RecipeOut]-?: K extends NullableKey ? RecipeOut[K] : NonNullable<RecipeOut[K]>
};

/** Page collections and controls need defaults; nested API values remain untouched. */
export function recipeView(recipe: RecipeDraft | RecipeOut | RecipeView): RecipeView {
  return {
    id: "", userId: "", householdId: "", groupId: "", name: "", slug: "", image: "",
    recipeServings: 0, recipeYieldQuantity: 0, recipeYield: "", totalTime: "", prepTime: "",
    performTime: "", totalTimeSeconds: null, prepTimeSeconds: null, performTimeSeconds: null,
    description: "", recipeCategory: [], tags: [], tools: [],
    rating: 0, orgURL: "", dateAdded: null, dateUpdated: null, createdAt: null, updatedAt: null,
    recipeIngredient: [], recipeInstructions: [], nutrition: {}, settings: {},
    assets: [], notes: [], extras: {}, comments: [],
    ...Object.fromEntries(Object.entries(recipe).filter(([, value]) => value != null)),
  } as RecipeView;
}

/** UI/JSON drafts can contain blank dates; the API expects a date or null. */
export function recipeSavePayload(recipe: RecipeDraft | RecipeOut | RecipeView): RecipeDraft {
  const payload: RecipeDraft = { ...recipe };
  for (const key of ["dateAdded", "dateUpdated", "createdAt", "updatedAt"] as const) {
    const value = payload[key];
    if (typeof value === "string" && !value.trim()) payload[key] = null;
  }
  return payload;
}
