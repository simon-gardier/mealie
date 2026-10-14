<template>
  <div>
    <v-card-title class="headline">
      {{ $t('recipe.create-recipe') }}
    </v-card-title>
    <v-card-text>
      {{ $t('recipe.create-a-recipe-by-providing-the-name-all-recipes-must-have-unique-names') }}
      <v-form ref="domCreateByName" @submit.prevent>
        <v-text-field
          v-model="newRecipeName"
          class="my-3"
          :label="$t('recipe.recipe-name')"
          :prepend-inner-icon="$globals.icons.primary"
          validate-on="blur"
          density="compact"
          autofocus
          variant="filled"
          clearable
          :rules="[validators.required]"
          :hint="$t('recipe.new-recipe-names-must-be-unique')"
          persistent-hint
          style="--v-input-control-height: 60px"
          @keyup.enter="createByName(newRecipeName)"
        />
      </v-form>
    </v-card-text>
    <v-card-actions class="justify-center">
      <div style="width: 250px">
        <BaseButton
          :disabled="newRecipeName.trim() === ''"
          rounded
          block
          :loading="state.loading"
          @click="createByName(newRecipeName)"
        />
      </div>
    </v-card-actions>
    <BaseDialog
      v-model="state.error"
      :title="$t('new-recipe.error-title')"
      :cancel-text="$t('general.close')"
      disable-submit-on-enter
    >
      <v-card-text role="alert" style="overflow-wrap: anywhere;">
        {{ state.errorMessage || $t('events.something-went-wrong') }}
      </v-card-text>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import type { AxiosResponse } from "axios";
import { useUserApi } from "~/composables/api";
import { validators } from "~/composables/use-validators";
import type { VForm } from "~/types/auto-forms";

const state = reactive({
  error: false,
  errorMessage: "",
  loading: false,
});
const auth = useMealieAuth();
const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");

const api = useUserApi();
const router = useRouter();

function handleResponse(response: AxiosResponse<string> | null, edit = false) {
  if (response?.status !== 201) {
    state.error = true;
    state.loading = false;
    return;
  }
  router.push(`/g/${groupSlug.value}/r/${response.data}?edit=${edit.toString()}&celebrate=true`);
}

const newRecipeName = ref("");
const domCreateByName = ref<VForm | null>(null);

async function createByName(name: string) {
  if (!name.trim() || state.loading) {
    return;
  }
  const validation = await domCreateByName.value?.validate();
  if (!validation?.valid) {
    return;
  }
  state.error = false;
  state.errorMessage = "";
  state.loading = true;
  try {
    const { response, error } = await api.recipes.createOne({ name });
    state.errorMessage = error?.message || "";
    handleResponse(response as any, true);
  }
  catch (error) {
    state.errorMessage = error instanceof Error ? error.message : "";
    state.error = true;
  }
  finally {
    state.loading = false;
  }
}
</script>
