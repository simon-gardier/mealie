import { expect, test } from "vitest";
import { ingredientAnalysisErrorKey } from "./ingredient-analysis-error";

test.each([
  ["nlp", null, "error-nlp"],
  ["openai", null, "error-ai"],
  ["brute", null, "error-analysis"],
  ["openai", { response: { status: 429 } }, "error-busy"],
  ["nlp", { response: { status: 504 } }, "error-timeout"],
  ["openai", { code: "ECONNABORTED" }, "error-timeout"],
  ["nlp", { code: "ERR_NETWORK" }, "error-network"],
  ["nlp", { request: {} }, "error-network"],
])("%s analysis selects %s guidance", (parser, error, key) => {
  expect(ingredientAnalysisErrorKey(parser as string, error)).toBe(`recipe.parser.${key}`);
});
