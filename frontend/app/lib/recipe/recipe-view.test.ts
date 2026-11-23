import { describe, expect, test } from "vitest";
import { recipeSavePayload, recipeView } from "./recipe-view";
import type { RecipeDraft } from "~/lib/api/types/recipe";

describe("recipe page defaults", () => {
  test("keeps a never-cooked recipe's dates null when saved", () => {
    const view = recipeView({ name: "New recipe", dateUpdated: null });
    expect(view.dateUpdated).toBeNull();
    expect(recipeSavePayload(view).dateUpdated).toBeNull();
  });

  test("normalizes only blank optional dates without mutating the draft or populated dates", () => {
    const source: RecipeDraft = { dateAdded: " ", dateUpdated: "", createdAt: "2026-10-13T12:00:00Z", updatedAt: null, name: "New recipe", recipeIngredient: [{ note: "Salt" }] };
    expect(recipeSavePayload(source)).toMatchObject({ dateAdded: null, dateUpdated: null, createdAt: source.createdAt, updatedAt: null, recipeIngredient: source.recipeIngredient });
    expect(source.dateAdded).toBe(" ");
    expect(recipeSavePayload({ dateAdded: "invalid date" }).dateAdded).toBe("invalid date");
  });
  test("initializes missing and null page collections without inventing nested data", () => {
    // the API can still send nulls for these, so the page must default them
    const source = { name: null, notes: null, recipeInstructions: null } as unknown as RecipeDraft;
    const view = recipeView(source);
    expect(view.name).toBe("");
    expect(view.notes).toEqual([]);
    expect(view.recipeInstructions).toEqual([]);
    expect(view.nutrition).toEqual({});
    expect(source.notes).toBeNull();
  });

  test("preserves populated API data including unrecognized ingredients", () => {
    const source: RecipeDraft = {
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
