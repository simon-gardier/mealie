import type { RecipeIngredient } from "~/lib/api/types/household";

export function unanalyzedSubrecipeNames(ingredients: RecipeIngredient[] | undefined): string[] {
  const names = new Set<string>();
  const visited = new Set<object>();
  function visit(rows: RecipeIngredient[] | undefined) {
    for (const ingredient of rows ?? []) {
      const recipe = ingredient.referencedRecipe;
      if (!recipe || visited.has(recipe)) continue;
      visited.add(recipe);
      if ((!recipe.recipeIngredient?.length || recipe.recipeIngredient.some(row => !row.referencedRecipe && !row.food)) && recipe.name) names.add(recipe.name);
      visit(recipe.recipeIngredient);
    }
  }
  visit(ingredients);
  return [...names];
}

export function canScaleShoppingRecipe(ingredients: RecipeIngredient[] | undefined, ancestors = new Set<object>()): boolean {
  if (!ingredients?.length || ancestors.has(ingredients)) return false;
  ancestors.add(ingredients);
  try {
    return ingredients.every(ingredient => ingredient.referencedRecipe
      ? canScaleShoppingRecipe(ingredient.referencedRecipe.recipeIngredient, ancestors)
      : !!ingredient.food);
  }
  finally { ancestors.delete(ingredients); }
}

export interface ShoppingRecipePortions {
  recipeId: string;
  recipeScale: number;
  basePortions: number;
  desiredPortions: number | null;
  canScale?: boolean;
  parentRecipe?: { id?: string | null };
}
export function setShoppingRecipePortions(sections: ShoppingRecipePortions[], section: ShoppingRecipePortions, portions: number | null) {
  if (section.canScale === false) return;
  section.desiredPortions = portions;
  if (portions == null || !Number.isFinite(portions) || portions <= 0) return;
  const nextScale = portions / section.basePortions;
  const ratio = nextScale / section.recipeScale;
  section.recipeScale = nextScale;
  const visited = new Set<ShoppingRecipePortions>([section]);
  function scaleChildren(parent: ShoppingRecipePortions) {
    for (const child of sections) {
      if (visited.has(child) || child.canScale === false || child.parentRecipe?.id !== parent.recipeId) continue;
      visited.add(child);
      child.recipeScale *= ratio;
      child.desiredPortions = child.basePortions * child.recipeScale;
      scaleChildren(child);
    }
  }
  scaleChildren(section);
}
