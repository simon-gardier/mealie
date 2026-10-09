export function ingredientAnalysisErrorKey(parser: string, error: unknown): string {
  const failure = error as { code?: string; request?: unknown; response?: { status?: number } } | null;
  if (failure?.code === "ECONNABORTED" || failure?.code === "ETIMEDOUT" || failure?.response?.status === 504) return "recipe.parser.error-timeout";
  if (failure?.response?.status === 429) return "recipe.parser.error-busy";
  if (failure?.code === "ERR_NETWORK" || (failure?.request && !failure.response)) return "recipe.parser.error-network";
  return parser === "openai" ? "recipe.parser.error-ai" : parser === "nlp" ? "recipe.parser.error-nlp" : "recipe.parser.error-analysis";
}
export function ingredientAnalysisErrorReason(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("response" in error)) return;
  const response = error.response;
  if (!response || typeof response !== "object" || !("data" in response)) return;
  const data = response.data;
  if (!data || typeof data !== "object" || !("detail" in data)) return;
  const detail = data.detail;
  if (typeof detail === "string") return detail.trim() || undefined;
  if (detail && typeof detail === "object" && "reason" in detail && typeof detail.reason === "string") {
    return detail.reason.trim() || undefined;
  }
}
