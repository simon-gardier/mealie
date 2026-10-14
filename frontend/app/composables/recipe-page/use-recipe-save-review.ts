import { getCurrentScope, onScopeDispose, ref } from "vue";
import type { RecipeSaveWarning } from "~/lib/recipe/save-warnings";

export function useRecipeSaveReview() {
  const saveReviewOpen = ref(false);
  const saveWarnings = ref<RecipeSaveWarning[]>([]);
  let pending: ((accepted: boolean) => void) | undefined;

  function finishSaveReview(accepted: boolean) {
    if (!pending) return;
    const resolve = pending;
    pending = undefined;
    saveReviewOpen.value = false;
    resolve(accepted);
  }

  async function requestSaveReview(warnings: RecipeSaveWarning[]): Promise<boolean> {
    if (pending) return false;
    if (!warnings.length) return true;
    saveWarnings.value = warnings;
    saveReviewOpen.value = true;
    return new Promise(resolve => pending = resolve);
  }

  if (getCurrentScope()) onScopeDispose(() => finishSaveReview(false));
  return { saveReviewOpen, saveWarnings, requestSaveReview, finishSaveReview };
}
