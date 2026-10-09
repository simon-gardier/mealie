/** Normalize decimal input before the locale-specific number field parses it. */
function insertDecimalText(event: Event, text: string, separator: string) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;
  const insertion = text.replace(/[.,]/g, separator);
  const candidate = input.value.slice(0, start) + insertion + input.value.slice(end);
  // Quantities are nonnegative and have at most one decimal separator.
  if (!/^\d*(?:[.,]\d*)?$/.test(candidate)) return;
  input.setRangeText(insertion, start, end, "end");
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

export function normalizeQuantityInput(event: InputEvent, separator: string) {
  if (event.isComposing || !event.cancelable || !event.data || !/[.,]/.test(event.data)) return;
  insertDecimalText(event, event.data, separator);
}

export function normalizeQuantityPaste(event: ClipboardEvent, separator: string) {
  const text = event.clipboardData?.getData("text").trim();
  if (!text || !/[.,]/.test(text)) return;
  insertDecimalText(event, text, separator);
}
