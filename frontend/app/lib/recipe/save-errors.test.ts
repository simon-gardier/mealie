import { describe, expect, it } from "vitest";
import { recipeSaveIssues } from "./save-errors";

const t = (key: string) => key;
const error = (detail: unknown, status = 422) => ({ response: { status, data: { detail } } });

describe("recipe save errors", () => {
  it("identifies every invalid ingredient and instruction with one-based positions", () => {
    expect(recipeSaveIssues(error([
      { loc: ["body", "recipeIngredient", 2, "quantity"], type: "float_parsing", msg: "Invalid number", input: "private input" },
      { loc: ["body", "recipeInstructions", 0, "ingredientReferences", 1, "referenceId"], msg: "Invalid UUID" },
    ]), t)).toEqual([
      { field: "recipe.ingredient › 3 › recipe.quantity", message: "recipe.save-error-number" },
      { field: "recipe.instructions › 1 › ingredient References › 2 › reference Id", message: "Invalid UUID" },
    ]);
  });

  it("handles missing fields, nested objects, and legacy validation errors", () => {
    expect(recipeSaveIssues(error([{ loc: ["body", "recipeIngredient", 0, "food", "name"], type: "value_error.missing" }]), t))
      .toEqual([{ field: "recipe.ingredient › 1 › shopping-list.food › general.name", message: "recipe.save-error-required" }]);
  });

  it.each(["Cannot save recipe", { message: "Cannot save recipe" }])("retains server explanations: %j", (detail) => {
    expect(recipeSaveIssues(error(detail), t)[0]?.message).toBe("Cannot save recipe");
  });

  it.each([undefined, [], [null, "unexpected"], { unexpected: true }])("provides feedback for malformed validation details: %j", (detail) => {
    expect(recipeSaveIssues(error(detail), t)[0]?.message).toBe("recipe.save-error-invalid");
  });

  it("provides retry guidance for network errors", () => {
    expect(recipeSaveIssues(new Error("Network Error"), t)[0]?.message).toBe("recipe.save-error-retry");
  });
  it("supports Mealie's development validation response", () => {
    expect(recipeSaveIssues({ response: { status: 422, data: { status_code: 422, message: "recipeIngredient.0.quantity: invalid number", data: null } } }, t)[0]?.message)
      .toBe("recipeIngredient.0.quantity: invalid number");
  });
  it("turns the reported lastMade error into a localized field and date hint", () => {
    const message = "1 validation error: {'type': 'datetime_from_date_parsing', 'loc': ('body', 'lastMade'), 'msg': 'Input should be a valid datetime or date, input is too short', 'input': '', 'ctx': {'error': 'input is too short'}} File \"/workspace/mealie/routes/recipe/recipe_crud_routes.py\", line 640, in update_one PUT /api/recipes/{slug}";
    expect(recipeSaveIssues({ response: { status: 422, data: { message } } }, t)).toEqual([{ field: "general.last-made", message: "recipe.save-error-date" }]);
  });

  it("extracts multiple legacy errors and hides unrecognized validation dumps", () => {
    const message = "2 validation errors: {'type': 'missing', 'loc': ('body', 'recipeIngredient', 2, 'food', 'name'), 'msg': 'Field required', 'input': {}} {'type': 'float_parsing', 'loc': ('body', 'recipeIngredient', 3, 'quantity'), 'msg': 'Invalid number', 'input': 'private'}";
    expect(recipeSaveIssues(error(message), t)).toEqual([
      { field: "recipe.ingredient › 3 › shopping-list.food › general.name", message: "recipe.save-error-required" },
      { field: "recipe.ingredient › 4 › recipe.quantity", message: "recipe.save-error-number" },
    ]);
    expect(recipeSaveIssues(error("1 validation error: unexpected traceback details"), t)[0]?.message).toBe("recipe.save-error-invalid");
  });
});
