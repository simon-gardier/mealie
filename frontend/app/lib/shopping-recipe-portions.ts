export interface ShoppingRecipePortions {
  recipeId: string;
  recipeScale: number;
  basePortions: number;
  desiredPortions: number | null;
  parentRecipe?: { id?: string };
}
export function setShoppingRecipePortions(sections: ShoppingRecipePortions[], section: ShoppingRecipePortions, portions: number | null) {
  section.desiredPortions = portions;
  if (portions == null || !Number.isFinite(portions) || portions <= 0) return;
  const nextScale = portions / section.basePortions;
  const ratio = nextScale / section.recipeScale;
  section.recipeScale = nextScale;
  const visited = new Set<ShoppingRecipePortions>([section]);
  function scaleChildren(parent: ShoppingRecipePortions) {
    for (const child of sections) {
      if (visited.has(child) || child.parentRecipe?.id !== parent.recipeId) continue;
      visited.add(child);
      child.recipeScale *= ratio;
      child.desiredPortions = child.basePortions * child.recipeScale;
      scaleChildren(child);
    }
  }
  scaleChildren(section);
}
