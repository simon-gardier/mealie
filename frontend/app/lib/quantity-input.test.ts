import { describe, expect, it, vi } from "vitest";
import { normalizeQuantityInput, normalizeQuantityPaste } from "./quantity-input";

function quantityInput(value: string, separator: string) {
  const input = document.createElement("input");
  input.value = value;
  input.setSelectionRange(value.length, value.length);
  input.addEventListener("beforeinput", event => normalizeQuantityInput(event as InputEvent, separator), true);
  input.addEventListener("paste", event => normalizeQuantityPaste(event as ClipboardEvent, separator), true);
  return input;
}

describe("ingredient decimal input", () => {
  it.each([[",", ".", "1.5"], [".", ",", "1,5"], [".", ".", "1.5"], [",", ",", "1,5"]])(
    "accepts %s with locale separator %s", (typed, localeSeparator, expected) => {
      const input = quantityInput("1", localeSeparator);
      const changed = vi.fn();
      input.addEventListener("input", changed);
      input.dispatchEvent(new InputEvent("beforeinput", { data: typed + "5", inputType: "insertText", cancelable: true }));
      expect(input.value).toBe(expected);
      expect(changed).toHaveBeenCalledOnce();
      expect(Number(input.value.replace(",", "."))).toBe(1.5);
    },
  );

  it("preserves a trailing decimal separator while typing", () => {
    const input = quantityInput("1", ",");
    input.dispatchEvent(new InputEvent("beforeinput", { data: ".", cancelable: true }));
    expect(input.value).toBe("1,");
  });

  it("replaces selected text with a pasted comma decimal", () => {
    const input = quantityInput("12", ".");
    input.setSelectionRange(0, 2);
    const paste = new Event("paste", { cancelable: true });
    Object.defineProperty(paste, "clipboardData", { value: { getData: () => "0,25" } });
    input.dispatchEvent(paste);
    expect(input.value).toBe("0.25");
  });

  it("rejects a second separator without changing the quantity", () => {
    const input = quantityInput("1,5", ",");
    input.dispatchEvent(new InputEvent("beforeinput", { data: ".", cancelable: true }));
    expect(input.value).toBe("1,5");
  });
});
