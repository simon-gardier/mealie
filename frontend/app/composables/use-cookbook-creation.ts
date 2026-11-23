import { ref } from "vue";
import type { CookBookCreate } from "~/lib/api/types/cookbook";

export function useCookbookCreation(createOne: (data: CookBookCreate) => Promise<unknown>) {
  const draft = ref<CookBookCreate | null>(null);
  const saving = ref(false);

  function open(name: string) {
    if (saving.value) return;
    draft.value = { name, description: "", public: false, queryFilterString: "" };
  }

  function cancel() {
    if (!saving.value) draft.value = null;
  }

  async function save() {
    if (saving.value || !draft.value?.name.trim() || !draft.value.queryFilterString) return false;
    saving.value = true;
    try {
      const saved = await createOne({ ...draft.value, name: draft.value.name.trim() });
      if (!saved) return false;
      draft.value = null;
      return true;
    }
    finally {
      saving.value = false;
    }
  }

  return { draft, saving, open, cancel, save };
}
