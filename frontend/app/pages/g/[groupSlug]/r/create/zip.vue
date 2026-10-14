<template>
  <v-form>
    <div>
      <v-card-title class="headline">
        {{ $t('recipe.import-from-zip') }}
      </v-card-title>
      <v-card-text>
        {{ $t('recipe.import-from-zip-description') }}
        <v-file-input
          v-model="newRecipeZip"
          accept=".zip"
          label=".zip"
          class="my-3"
          density="compact"
          variant="filled"
          style="--v-input-control-height: 60px"
          clearable
          truncate-length="100"
          :hint="$t('recipe.zip-files-must-have-been-exported-from-mealie')"
          persistent-hint
          prepend-icon=""
          :prepend-inner-icon="$globals.icons.zip"
        />
      </v-card-text>
      <v-card-actions class="justify-center">
        <div style="width: 250px">
          <BaseButton :disabled="newRecipeZip === null" rounded block :loading="state.loading" @click="createByZip" />
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
  </v-form>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import { useGlobalI18n } from "~/composables/use-global-i18n";

const state = reactive({
  loading: false,
  error: false,
  errorMessage: "",
});
const auth = useMealieAuth();
const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");

const api = useUserApi();
const router = useRouter();
const i18n = useGlobalI18n();

const newRecipeZip = ref<File | null>(null);
const newRecipeZipFileName = "archive";

async function createByZip() {
  if (!newRecipeZip.value || state.loading) {
    return;
  }
  const formData = new FormData();
  formData.append(newRecipeZipFileName, newRecipeZip.value);

  state.error = false;
  state.errorMessage = "";
  state.loading = true;
  try {
    const response = await api.upload.file("/api/recipes/create/zip", formData);
    if (response?.status !== 201) {
      throw new Error(i18n.t("events.something-went-wrong"));
    }
    router.push(`/g/${groupSlug.value}/r/${response.data}`);
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
