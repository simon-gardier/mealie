import { useUserApi } from "~/composables/api";
import type { VForm } from "~/types/auto-forms";
import type { RecipeTool } from "~/lib/api/types/recipe";

export const useTools = function (eager = true) {
  const workingToolData = reactive<RecipeTool>({
    id: "",
    name: "",
    slug: "",
  });

  const api = useUserApi();
  const loading = ref(false);
  const validForm = ref(false);
  const tools = ref<RecipeTool[]>([]);

  const actions = {
    getAll() {
      loading.value = true;
      return actions.refreshAll();
    },

    async refreshAll() {
      loading.value = true;
      try {
        const { data } = await api.tools.getAll();
        if (data) {
          tools.value = data.items;
        }
      }
      finally { loading.value = false; }
    },

    async createOne(domForm: VForm | null = null) {
      if (loading.value) return;
      if (domForm && !(await domForm.validate()).valid) {
        validForm.value = false;
        return;
      }

      loading.value = true;

      try {
        const { data } = await api.tools.createOne(workingToolData);

        if (data) {
          tools.value?.push(data);
          domForm?.reset();
          this.reset();
        }
      }
      finally { loading.value = false; }
    },

    async updateOne() {
      if (loading.value) return;
      loading.value = true;
      try {
        const { data } = await api.tools.updateOne(workingToolData.id, workingToolData);
        if (data) {
          const index = tools.value.findIndex(tool => tool.id === data.id);
          if (index >= 0) tools.value[index] = data;
          else tools.value.push(data);
          this.reset();
        }
      }
      finally { loading.value = false; }
    },

    async deleteOne(id: string) {
      if (loading.value) return;
      loading.value = true;
      try {
        const { error } = await api.tools.deleteOne(id);
        if (!error) {
          tools.value = tools.value.filter(tool => tool.id !== id);
          this.reset();
        }
      }
      finally { loading.value = false; }
    },

    reset() {
      workingToolData.name = "";
      workingToolData.id = "";
      loading.value = false;
      validForm.value = true;
    },
  };

  if (eager) onMounted(() => actions.refreshAll());

  return {
    tools,
    actions,
    workingToolData,
    loading,
  };
};
