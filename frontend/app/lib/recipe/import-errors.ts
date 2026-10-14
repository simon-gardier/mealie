export function recipeImportErrorKey(error: unknown): string | undefined {
  const failure = error as { status?: number; message?: string } | null;
  if (failure?.status === 401 || failure?.status === 403) return "recipe.url-import-error-session";
  if (failure?.status === 429) return "recipe.url-import-error-busy";
  if (failure?.status === 502 || failure?.status === 503 || failure?.status === 504) return "recipe.url-import-error-connection";
  if (!failure?.message || failure.message === "Recipe creation failed") return "recipe.url-import-error-connection";
  if (["BAD_RECIPE_DATA", "NO_RECIPE_DATA"].includes(failure.message)) return "recipe.url-import-error-source";
  if (failure.message === "CONNECTION_ERROR") return "recipe.url-import-error-connection";
}
