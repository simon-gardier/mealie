export interface RecipeSaveIssue {
  field: string;
  message: string;
}

type Translate = (key: string) => string;
const labels: Record<string, string> = {
  name: "general.name", description: "recipe.description", recipeIngredient: "recipe.ingredient",
  recipeInstructions: "recipe.instructions", quantity: "recipe.quantity", unit: "recipe.unit",
  food: "shopping-list.food", note: "recipe.notes", notes: "recipe.notes", title: "general.title",
  recipeServings: "recipe.recipe-servings", recipeYield: "recipe.recipe-yield",
  prepTime: "recipe.prep-time", performTime: "recipe.perform-time", totalTime: "recipe.total-time",
  orgURL: "recipe.original-url", recipeCategory: "recipe.categories", tags: "tag.tags",
  nutrition: "recipe.nutrition",
  lastMade: "general.last-made", dateAdded: "general.created", dateUpdated: "general.updated",
  createdAt: "general.created", updatedAt: "general.updated",
};

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

/** Mealie development mode serializes Pydantic errors as Python text, not JSON.
 * Extract only type/location/message; never evaluate it or display inputs/tracebacks. */
function validationIssuesFromText(text: string): Record<string, unknown>[] {
  const issues: Record<string, unknown>[] = [];
  const pattern = /'type':\s*'([^']+)'[\s\S]*?'loc':\s*\(([^)]*)\)[\s\S]*?'msg':\s*'((?:\\.|[^'\\])*)'/g;
  for (const match of text.matchAll(pattern)) {
    const loc = [...match[2]!.matchAll(/'((?:\\.|[^'\\])*)'|(\d+)/g)]
      .map(part => part[1] !== undefined ? part[1] : Number(part[2]));
    issues.push({ type: match[1], loc, msg: match[3]!.replace(/\\(['"\\])/g, "$1") });
  }
  return issues;
}

export function recipeSaveIssues(error: unknown, t: Translate): RecipeSaveIssue[] {
  const response = record(record(error)?.response);
  const body = record(response?.data);
  const detail = body?.detail;
  const serverMessage = typeof detail === "string" ? detail : record(detail)?.message ?? body?.message;
  const fallback = t(response?.status === 422 ? "recipe.save-error-invalid" : "recipe.save-error-retry");
  const issues: RecipeSaveIssue[] = [];
  const validation = Array.isArray(detail) ? detail : typeof serverMessage === "string" ? validationIssuesFromText(serverMessage) : [];
  if (validation.length) {
    for (const value of validation) {
      const issue = record(value);
      if (!issue) continue;
      const path = Array.isArray(issue.loc) ? issue.loc.filter(part => typeof part === "string" || typeof part === "number") : [];
      const field = path.filter(part => part !== "body").map(part => typeof part === "number"
        ? String(part + 1)
        : labels[part] ? t(labels[part]) : part.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ")).join(" › ");
      let message = typeof issue.msg === "string" && issue.msg.trim() ? issue.msg : fallback;
      if (issue.type === "missing" || issue.type === "value_error.missing") message = t("recipe.save-error-required");
      else if (["float_parsing", "int_parsing", "float_type", "int_type", "type_error.float", "type_error.integer"].includes(String(issue.type))) message = t("recipe.save-error-number");
      else if (/^(datetime|date|time)_/.test(String(issue.type))) message = t("recipe.save-error-date");
      issues.push({ field: field || t("general.recipe"), message });
    }
  }
  if (issues.length) return issues;
  // A raw validation dump contains implementation details and sometimes recipe inputs.
  const message = typeof serverMessage === "string" && /validation error|Traceback|File "\/workspace/i.test(serverMessage) ? fallback : serverMessage;
  return [{ field: t("general.recipe"), message: typeof message === "string" && message.trim() ? message : fallback }];
}
