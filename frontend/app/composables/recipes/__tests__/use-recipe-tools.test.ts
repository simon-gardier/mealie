import { beforeEach, describe, expect, test, vi } from "vitest";
import { useTools } from "../use-recipe-tools";
import type { VForm } from "~/types/auto-forms";

const api = vi.hoisted(() => ({ getAll: vi.fn(), createOne: vi.fn(), updateOne: vi.fn(), deleteOne: vi.fn() }));
vi.mock("~/composables/api", () => ({ useUserApi: () => ({ tools: api }) }));

describe("tool request safety", () => {
  beforeEach(() => vi.resetAllMocks());

  test("releases loading after a rejected refresh", async () => {
    api.getAll.mockRejectedValue(new Error("offline"));
    const state = useTools(false);
    await expect(state.actions.refreshAll()).rejects.toThrow("offline");
    expect(state.loading.value).toBe(false);
  });

  test("does not submit an invalid form", async () => {
    const state = useTools(false);
    const form = { validate: vi.fn().mockResolvedValue({ valid: false }) } as unknown as VForm;
    await state.actions.createOne(form);
    expect(api.createOne).not.toHaveBeenCalled();
    expect(state.loading.value).toBe(false);
  });

  test("updates an existing tool without duplicating it", async () => {
    const state = useTools(false);
    state.tools.value = [{ id: "tool", name: "Old", slug: "old" }];
    state.workingToolData.id = "tool";
    api.updateOne.mockResolvedValue({ data: { id: "tool", name: "New", slug: "new" } });
    await state.actions.updateOne();
    expect(state.tools.value).toEqual([{ id: "tool", name: "New", slug: "new" }]);
    expect(state.loading.value).toBe(false);
  });

  test("retains the draft and releases loading after a failed create", async () => {
    const state = useTools(false);
    state.workingToolData.name = "Spatula";
    api.createOne.mockRejectedValue(new Error("offline"));
    await expect(state.actions.createOne()).rejects.toThrow("offline");
    expect(state.workingToolData.name).toBe("Spatula");
    expect(state.loading.value).toBe(false);
  });
});
