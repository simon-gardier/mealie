<template>
  <div>
    <v-form ref="domUrlForm" @submit.prevent="createByUrl(recipeUrl, importKeywordsAsTags, importCategories)">
      <div class="recipe-url-form">
        <v-card-title class="recipe-import-heading d-flex align-center ga-2">
          {{ $t('recipe.editor.import-url-title') }}
          <v-menu location="bottom end" :close-on-content-click="false" max-width="480">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                variant="text"
                size="small"
                type="button"
                :aria-label="$t('recipe.scrape-recipe-description')"
              >
                <v-icon :icon="$globals.icons.informationOutline" />
              </v-btn>
            </template>
            <v-card>
              <v-card-text class="recipe-import-help">
                <p>{{ $t('recipe.scrape-recipe-description') }}</p>
                <p v-if="group?.aiProviderSettings?.audioProviderEnabled">
                  {{ $t('recipe.scrape-recipe-description-transcription') }}
                </p>
                <p>
                  {{ $t('recipe.scrape-recipe-have-a-lot-of-recipes') }}
                  <router-link :to="bulkImporterTarget" class="text-primary">{{
                    $t('recipe.scrape-recipe-suggest-bulk-importer') }}</router-link>.
                </p>
                <p>
                  {{ $t('recipe.scrape-recipe-have-raw-html-or-json-data') }}
                  <router-link :to="htmlOrJsonImporterTarget" class="text-primary">{{
                    $t('recipe.scrape-recipe-you-can-import-from-raw-data-directly') }}</router-link>.
                </p>
                <p v-if="aiEnabled">
                  {{ $t('recipe.scrape-recipe-have-ai-read-the-page') }}
                  <router-link :to="aiImporterTarget" class="text-primary">{{ $t('recipe.import-with-ai') }}</router-link>.
                </p>
                <AdvancedOnly>
                  <p class="mt-3">
                    <router-link to="/group/migrations" class="text-primary">
                      {{ $t('recipe.looking-for-migrations') }}
                    </router-link>
                  </p>
                </AdvancedOnly>
              </v-card-text>
            </v-card>
          </v-menu>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="recipeUrl"
            class="mt-4 mb-2"
            :label="$t('new-recipe.recipe-url')"
            :prepend-inner-icon="$globals.icons.link"
            validate-on="blur lazy"
            density="compact"
            variant="filled"
            clearable
            :rules="[validators.url]"
            :hint="$t('new-recipe.url-form-hint')"
            persistent-hint
            style="--v-input-control-height: 60px"
          />
        </v-card-text>
        <div class="px-4 pb-2">
          <v-menu location="bottom start" :close-on-content-click="false" max-width="480">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="text" type="button" :append-icon="$globals.icons.chevronDown">
                {{ $t('recipe.editor.import-options') }}
              </v-btn>
            </template>
            <v-card>
              <v-card-text>
                <v-checkbox
                  v-model="importKeywordsAsTags"
                  color="primary"
                  hide-details
                  :label="$t('recipe.import-original-keywords-as-tags')"
                />
                <v-checkbox
                  v-model="importCategories"
                  color="primary"
                  hide-details
                  :label="$t('recipe.import-original-categories')"
                />
                <v-checkbox v-model="stayInEditMode" color="primary" hide-details :label="$t('recipe.stay-in-edit-mode')" />
                <v-checkbox
                  v-model="parseRecipe"
                  color="primary"
                  hide-details
                  :label="$t('recipe.parse-recipe-ingredients-after-import')"
                />
              </v-card-text>
            </v-card>
          </v-menu>
        </div>
        <v-card-actions class="justify-center">
          <div style="width: 100%" class="text-center">
            <div style="width: 250px; margin: 0 auto">
              <BaseButton
                :disabled="!recipeUrl?.trim() || state.loading"
                :text="$t('recipe.editor.import-recipe')"
                :icon="$globals.icons.link"
                variant="tonal"
                block
                type="submit"
                :loading="state.loading"
              />
            </div>
            <v-card-text v-if="createStatus" class="py-2" role="status" aria-live="polite">
              <!-- render &nbsp; to maintain layout -->
              {{ createStatus }}&nbsp;
            </v-card-text>
          </div>
        </v-card-actions>
      </div>
    </v-form>
    <BaseDialog
      v-model="state.error"
      :title="$t('recipe.url-import-error-title')"
      :cancel-text="$t('general.close')"
      width="650"
      disable-submit-on-enter
    >
      <div class="recipe-import-error" role="alert">
        <p class="recipe-import-error-message">
          {{ errorMessage }}
        </p>
        <p class="recipe-import-error-help">
          {{ $t('recipe.url-import-error-help') }}
        </p>
        <div class="recipe-import-error-actions">
          <BaseButton
            v-if="errorStatus === 401"
            :to="loginTarget"
            :text="$t('user.sign-in')"
            :icon="$globals.icons.user"
            variant="tonal"
          />
          <BaseButton
            :text="$t('recipe.url-import-retry')"
            :icon="$globals.icons.refresh"
            variant="tonal"
            :disabled="state.loading || !recipeUrl?.trim()"
            @click="createByUrl(recipeUrl, importKeywordsAsTags, importCategories)"
          />
          <BaseButton
            v-if="aiEnabled"
            :to="aiImporterTarget"
            :text="$t('recipe.import-with-ai')"
            :icon="$globals.icons.autoFix"
            variant="tonal"
          />
          <BaseButton
            :to="htmlOrJsonImporterTarget"
            :text="$t('recipe.url-import-html')"
            :icon="$globals.icons.codeTags"
            variant="text"
          />
        </div>
      </div>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { recipeImportErrorKey } from "~/lib/recipe/import-errors";
import { useRecipeImportUrl } from "~/composables/use-recipe-import-url";
import type { AxiosResponse } from "axios";
import { useUserApi } from "~/composables/api";
import { useGroupSelf } from "~/composables/use-groups";
import { useTagStore } from "~/composables/store/use-tag-store";
import { useNewRecipeOptions } from "~/composables/use-new-recipe-options";
import { validators } from "~/composables/use-validators";
import type { VForm } from "~/types/auto-forms";

definePageMeta({
  key: route => route.path,
});
const state = reactive({
  error: false,
  loading: false,
  errorMessage: "",
});

const { t } = useI18n();
const errorMessage = computed(() => {
  const key = recipeImportErrorKey({ message: state.errorMessage, status: errorStatus.value });
  return key ? t(key) : state.errorMessage;
});
const errorStatus = ref(0);

const auth = useMealieAuth();
const api = useUserApi();
const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");
const { group } = useGroupSelf();

const tags = useTagStore();

const {
  importKeywordsAsTags,
  importCategories,
  stayInEditMode,
  parseRecipe,
  navigateToRecipe,
} = useNewRecipeOptions();

const bulkImporterTarget = computed(() => `/g/${groupSlug.value}/r/create/bulk`);
const htmlOrJsonImporterTarget = computed(() => `/g/${groupSlug.value}/r/create/html`);
const aiImporterTarget = computed(() => `/g/${groupSlug.value}/r/create/ai`);
const aiEnabled = computed(() => !!group.value?.aiProviderSettings?.aiEnabled);

function handleResponse(response: AxiosResponse<string> | null, refreshTags = false) {
  if (response?.status !== 201) {
    state.error = true;
    state.loading = false;
    return;
  }
  if (refreshTags) {
    tags.actions.refresh();
  }

  navigateToRecipe(response.data, groupSlug.value, `/g/${groupSlug.value}/r/create/url`);
}

const recipeUrl = useRecipeImportUrl();
const loginTarget = computed(() => {
  const target = `/g/${groupSlug.value}/r/create/url?recipe_import_url=${encodeURIComponent(recipeUrl.value || "")}`;
  return `/login?redirect=${encodeURIComponent(target)}`;
});

onMounted(() => {
  if (recipeUrl.value) {
    // Apply legacy query params for older automations such as the Bookmarklet.
    // These are no longer used by the app itself but are easy to keep supporting.
    const importKeywordsAsTagsParam = route.query.use_keywords;
    if (importKeywordsAsTagsParam === "1") {
      importKeywordsAsTags.value = true;
    }
    else if (importKeywordsAsTagsParam === "0") {
      importKeywordsAsTags.value = false;
    }

    const stayInEditModeParam = route.query.edit;
    if (stayInEditModeParam === "1") {
      stayInEditMode.value = true;
    }
    else if (stayInEditModeParam === "0") {
      stayInEditMode.value = false;
    }

    // The URL is pre-filled via the recipeUrl computed property.
    // Do not auto-submit: the user should review the import options and
    // confirm by clicking the submit button.
  }
});

const domUrlForm = ref<VForm | null>(null);

const createStatus = ref<string | null>(null);
async function createByUrl(url: string | null, importKeywordsAsTags: boolean, importCategories: boolean) {
  if (url === null) {
    return;
  }

  const validation = await domUrlForm.value?.validate();
  if (!validation?.valid || !url.trim() || state.loading) {
    console.log("Invalid URL", url);
    return;
  }
  state.error = false;
  state.errorMessage = "";
  errorStatus.value = 0;
  state.loading = true;
  try {
    const { response, error } = await api.recipes.createOneByUrl(
      url,
      importKeywordsAsTags,
      importCategories,
      (message: string) => createStatus.value = message,
    );
    state.errorMessage = error?.message || "";
    errorStatus.value = error?.status || 0;
    handleResponse(response, importKeywordsAsTags);
  }
  catch (error) {
    state.errorMessage = error instanceof Error ? error.message : "";
    state.error = true;
  }
  finally {
    state.loading = false;
    createStatus.value = null;
  }
}
</script>

<style scoped>
.recipe-import-help p + p {
  margin-top: 12px;
}

.recipe-import-error {
  padding: 24px;
  color: rgb(var(--v-theme-on-surface));
}
.recipe-import-error-message {
  margin: 0;
  font: 400 15px/1.5 var(--bistro-body);
  overflow-wrap: anywhere;
}
.recipe-import-error-help {
  margin-top: 8px;
  color: rgb(var(--v-theme-text-secondary));
  font: 400 14px/1.5 var(--bistro-body);
}
.recipe-import-error-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.recipe-import-error-actions :deep(.v-btn) {
  min-height: 44px;
  height: auto;
  max-width: 100%;
  padding-block: 10px;
  border-radius: 10px;
  text-transform: none;
}
.recipe-import-error-actions :deep(.v-btn__content) {
  white-space: normal;
}
.recipe-url-form {
  padding: 20px;
  border: 1px solid rgba(var(--v-theme-separator), 0.5);
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
}
.recipe-import-heading {
  padding: 0;
  font: 600 18px var(--bistro-body);
  white-space: normal;
}
.recipe-url-form > .v-card-text {
  padding: 0;
}
.recipe-url-form > .v-card-actions {
  padding: 16px 0 0;
}
.recipe-url-form :deep(.v-btn) {
  min-height: 44px;
  border-radius: 10px;
  text-transform: none;
}
@media (max-width: 599px) {
  .recipe-url-form,
  .recipe-import-error {
    padding: 16px;
  }
}
</style>
