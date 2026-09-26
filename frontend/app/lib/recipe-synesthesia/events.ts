export const FAVORITED_EVENT = "mealie:recipe-favorited";

export function playRecipeSynesthesia(): void {
  document.dispatchEvent(new CustomEvent(FAVORITED_EVENT));
}
