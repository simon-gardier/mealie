import { describe, expect, test } from "vitest";
import { getActionColor } from "./action-color";

describe("destructive action colors", () => {
  test("trash icons always use the semantic delete color", () => {
    expect(getActionColor({ icon: "trash", color: "primary" }, "trash")).toBe("error");
  });
  test("delete menu actions without icons also use red", () => {
    expect(getActionColor({ event: "delete" }, "trash")).toBe("error");
    expect(getActionColor({ event: "delete-selected" }, "trash")).toBe("error");
    expect(getActionColor({ event: "deleteStep" }, "trash")).toBe("error");
  });
  test("keeps other actions' colors and defaults", () => {
    expect(getActionColor({ icon: "edit", color: "primary" }, "trash")).toBe("primary");
    expect(getActionColor({ event: "edit" }, "trash")).toBeUndefined();
  });
});
