import { describe, expect, it, vi } from "vitest";
import { useRecipeSave } from "./use-recipe-save";

describe("recipe saving", () => {
  it("exposes validation failures, releases the pending state, and allows retry", async () => {
    const state = useRecipeSave(key => key);
    const draft = { name: "Changed recipe" };
    const request = vi.fn().mockResolvedValueOnce({ data: null, error: { response: { status: 422, data: { detail: [{ loc: ["body", "name"], msg: "Too long" }] } } } })
      .mockResolvedValueOnce({ data: draft, error: null });
    expect(await state.save(request)).toBeNull();
    expect(state.saveErrorOpen.value).toBe(true);
    expect(state.saveErrors.value).toEqual([{ field: "general.name", message: "Too long" }]);
    expect(state.saving.value).toBe(false);
    expect(draft.name).toBe("Changed recipe");
    expect(await state.save(request)).toBe(draft);
    expect(state.saveErrorOpen.value).toBe(false);
    expect(state.saveErrors.value).toEqual([]);
  });

  it("blocks duplicate requests while a save is pending", async () => {
    const state = useRecipeSave(key => key);
    let complete!: (value: { data: { slug: string }; error: null; response: null }) => void;
    const request = vi.fn(() => new Promise<{ data: { slug: string }; error: null; response: null }>((resolve) => { complete = resolve; }));
    const first = state.save(request);
    expect(state.saving.value).toBe(true);
    expect(await state.save(request)).toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
    complete({ data: { slug: "recipe" }, error: null, response: null });
    expect(await first).toEqual({ slug: "recipe" });
    expect(state.saving.value).toBe(false);
  });

  it.each(["throw", "empty"])("shows feedback and unlocks after %s failure", async (failure) => {
    const state = useRecipeSave(key => key);
    await state.save(async () => {
      if (failure === "throw") throw new Error("Network Error");
      return { data: null, error: null, response: null };
    });
    expect(state.saveErrorOpen.value).toBe(true);
    expect(state.saveErrors.value.length).toBe(1);
    expect(state.saving.value).toBe(false);
  });
});
