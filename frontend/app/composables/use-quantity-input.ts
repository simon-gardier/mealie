import { normalizeQuantityInput, normalizeQuantityPaste } from "~/lib/quantity-input";

/** Shared decimal handling for quantity fields, including typing and paste. */
export function useQuantityInput() {
  const { locale } = useI18n();
  const quantityDecimalSeparator = computed(() => new Intl.NumberFormat(locale.value)
    .formatToParts(1.1).find(part => part.type === "decimal")?.value || ".");

  return {
    quantityDecimalSeparator,
    onQuantityInput: (event: InputEvent) => normalizeQuantityInput(event, quantityDecimalSeparator.value),
    onQuantityPaste: (event: ClipboardEvent) => normalizeQuantityPaste(event, quantityDecimalSeparator.value),
  };
}
