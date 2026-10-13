import { describe, expect, test } from "vitest";
import { recipeSavePayload, recipeView } from "./recipe-view";
import type { Recipe } from "~/lib/api/types/recipe";

describe("recipe page defaults", () => {
  test("keeps a never-cooked recipe's dates null when saved", () => {
    const view = recipeView({ name: "New recipe", lastMade: null });
    expect(view.lastMade).toBeNull();
    expect(recipeSavePayload(view).lastMade).toBeNull();
  });

  test("normalizes only blank optional dates without mutating the draft or populated dates", () => {
    const source: Recipe = { lastMade: "", dateAdded: " ", dateUpdated: "", createdAt: "2026-10-13T12:00:00Z", updatedAt: null, name: "New recipe", recipeIngredient: [{ note: "Salt" }] };
    expect(recipeSavePayload(source)).toMatchObject({ lastMade: null, dateAdded: null, dateUpdated: null, createdAt: source.createdAt, updatedAt: null, recipeIngredient: source.recipeIngredient });
    expect(source.lastMade).toBe("");
    expect(recipeSavePayload({ lastMade: "invalid date" }).lastMade).toBe("invalid date");
  });
  test("initializes missing and null page collections without inventing nested data", () => {
    const source: Recipe = { name: null, notes: null, recipeInstructions: null };
    const view = recipeView(source);
    expect(view.name).toBe("");
    expect(view.notes).toEqual([]);
    expect(view.recipeInstructions).toEqual([]);
    expect(view.nutrition).toEqual({});
    expect(source.notes).toBeNull();
  });

  test("preserves populated API data including unrecognized ingredients", () => {
    const source: Recipe = {
      id: "recipe", recipeServings: 6, rating: 0, settings: { public: false },
      recipeIngredient: [{ note: "a pinch of salt", food: null, unit: null }],
    };
    const view = recipeView(source);
    expect(view.id).toBe("recipe");
    expect(view.recipeServings).toBe(6);
    expect(view.rating).toBe(0);
    expect(view.settings.public).toBe(false);
    expect(view.recipeIngredient).toEqual(source.recipeIngredient);
    expect(view.recipeIngredient[0]?.food).toBeNull();
  });
});
