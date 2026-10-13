import { ref } from "vue";
import type { RequestResponse } from "~/lib/api/types/non-generated";
import { recipeSaveIssues, type RecipeSaveIssue } from "~/lib/recipe/save-errors";

export function useRecipeSave(t: (key: string) => string) {
  const saving = ref(false);
  const saveErrorOpen = ref(false);
  const saveErrors = ref<RecipeSaveIssue[]>([]);

  async function save<T>(request: () => Promise<RequestResponse<T>>): Promise<T | null> {
    if (saving.value) return null;
    saving.value = true;
    saveErrorOpen.value = false;
    saveErrors.value = [];
    try {
      const { data, error } = await request();
      if (error || !data) throw error;
      return data;
    }
    catch (error) {
      saveErrors.value = recipeSaveIssues(error, t);
      saveErrorOpen.value = true;
      return null;
    }
    finally {
      saving.value = false;
    }
  }

  return { saving, saveErrorOpen, saveErrors, save };
}
