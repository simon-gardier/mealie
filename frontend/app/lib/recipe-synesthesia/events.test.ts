import { describe, expect, it, vi } from "vitest";
import { captureSynesthesiaOrigin, FAVORITED_EVENT, playRecipeSynesthesia } from "./events";

describe("favorite animation origin", () => {
  it("captures the icon center independently of later focus or layout changes", () => {
    const button = document.createElement("button");
    const bounds = vi.spyOn(button, "getBoundingClientRect").mockReturnValue({ left: 100, top: 200, width: 44, height: 44 } as DOMRect);
    const origin = captureSynesthesiaOrigin(button);
    bounds.mockReturnValue({ left: 600, top: 700, width: 44, height: 44 } as DOMRect);
    const listener = vi.fn();
    document.addEventListener(FAVORITED_EVENT, listener, { once: true });
    playRecipeSynesthesia(origin);
    expect((listener.mock.calls[0]![0] as CustomEvent).detail).toEqual({ x: 122, y: 222 });
  });

  it("supports an absent trigger without using the currently focused element", () => {
    expect(captureSynesthesiaOrigin(null)).toBeUndefined();
    const listener = vi.fn();
    document.addEventListener(FAVORITED_EVENT, listener, { once: true });
    playRecipeSynesthesia();
    expect((listener.mock.calls[0]![0] as CustomEvent).detail).toBeNull();
  });
});
