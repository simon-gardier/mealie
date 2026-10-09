import { describe, expect, it, vi } from "vitest";
import { useCookbookCreation } from "./use-cookbook-creation";

describe("cookbook creation", () => {
  it("opens and cancels a local draft without persisting a cookbook", () => {
    const create = vi.fn();
    const creation = useCookbookCreation(create);
    creation.open("Family cookbook");
    expect(creation.draft.value?.public).toBe(false);
    creation.cancel();
    expect(creation.draft.value).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it("requires a name and completed filters before creating", async () => {
    const create = vi.fn();
    const creation = useCookbookCreation(create);
    creation.open("Family cookbook");
    expect(await creation.save()).toBe(false);
    creation.draft.value!.queryFilterString = "tags.id IN [\"tag-id\"]";
    creation.draft.value!.name = "  ";
    expect(await creation.save()).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("prevents duplicate requests and retains edits when a request fails", async () => {
    let finish!: (result: unknown) => void;
    const create = vi.fn((_data: { name: string }) => new Promise(resolve => finish = resolve));
    const creation = useCookbookCreation(create);
    creation.open("  Family cookbook  ");
    creation.draft.value!.queryFilterString = "tags.id IN [\"tag-id\"]";
    const pending = creation.save();
    expect(creation.saving.value).toBe(true);
    expect(await creation.save()).toBe(false);
    creation.cancel();
    expect(creation.draft.value).not.toBeNull();
    finish(null);
    expect(await pending).toBe(false);
    expect(creation.draft.value?.name).toBe("  Family cookbook  ");
    expect(creation.saving.value).toBe(false);
    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ name: "Family cookbook" }));
  });

  it("clears the draft only after a successful save", async () => {
    const creation = useCookbookCreation(vi.fn().mockResolvedValue({ id: "new-book" }));
    creation.open("Family cookbook");
    creation.draft.value!.queryFilterString = "tags.id IN [\"tag-id\"]";
    expect(await creation.save()).toBe(true);
    expect(creation.draft.value).toBeNull();
  });

  it("retains the draft and releases loading after a thrown request error", async () => {
    const creation = useCookbookCreation(vi.fn().mockRejectedValue(new Error("Network error")));
    creation.open("Family cookbook");
    creation.draft.value!.queryFilterString = "tags.id IN [\"tag-id\"]";
    await expect(creation.save()).rejects.toThrow("Network error");
    expect(creation.draft.value).not.toBeNull();
    expect(creation.saving.value).toBe(false);
  });
});
