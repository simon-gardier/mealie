import { describe, expect, it } from "vitest";
import { effectScope } from "vue";
import { useRecipeSaveReview } from "./use-recipe-save-review";
import type { RecipeSaveWarning } from "~/lib/recipe/save-warnings";

const warnings: RecipeSaveWarning[] = [{ code: "no-steps", count: 0 }];
describe("recipe save review", () => {
  it("passes through complete recipes without opening a dialog", async () => {
    const state = useRecipeSaveReview();
    expect(await state.requestSaveReview([])).toBe(true);
    expect(state.saveReviewOpen.value).toBe(false);
  });
  it("waits for a decision and blocks duplicate save attempts", async () => {
    const state = useRecipeSaveReview();
    const pending = state.requestSaveReview(warnings);
    expect(state.saveReviewOpen.value).toBe(true);
    expect(await state.requestSaveReview(warnings)).toBe(false);
    state.finishSaveReview(false);
    expect(await pending).toBe(false);
    expect(state.saveReviewOpen.value).toBe(false);
  });
  it("requires confirmation again on subsequent saves even when warnings are unchanged", async () => {
    const state = useRecipeSaveReview();
    const pending = state.requestSaveReview(warnings);
    state.finishSaveReview(true);
    expect(await pending).toBe(true);
    const repeated = state.requestSaveReview(warnings);
    expect(state.saveReviewOpen.value).toBe(true);
    state.finishSaveReview(true);
    expect(await repeated).toBe(true);
    const changed = state.requestSaveReview([...warnings, { code: "missing-time", count: 0 }]);
    expect(state.saveReviewOpen.value).toBe(true);
    state.finishSaveReview(false);
    expect(await changed).toBe(false);
  });
  it("allows review again after cancellation", async () => {
    const state = useRecipeSaveReview();
    const first = state.requestSaveReview(warnings);
    state.finishSaveReview(false);
    await first;
    const second = state.requestSaveReview(warnings);
    expect(state.saveReviewOpen.value).toBe(true);
    state.finishSaveReview(true);
    expect(await second).toBe(true);
  });
  it("settles pending saves if the editor unmounts", async () => {
    const scope = effectScope();
    const state = scope.run(() => useRecipeSaveReview())!;
    const pending = state.requestSaveReview(warnings);
    scope.stop();
    expect(await pending).toBe(false);
  });
});
