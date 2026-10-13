export const FAVORITED_EVENT = "mealie:recipe-favorited";

export interface SynesthesiaOrigin {
  x: number;
  y: number;
}

/** Capture before awaiting a mutation, while the triggering control is still in place. */
export function captureSynesthesiaOrigin(element: Element | null): SynesthesiaOrigin | undefined {
  if (!element) return undefined;
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function playRecipeSynesthesia(origin?: SynesthesiaOrigin): void {
  document.dispatchEvent(new CustomEvent(FAVORITED_EVENT, { detail: origin }));
}
