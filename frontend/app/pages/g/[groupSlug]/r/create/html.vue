<template>
  <v-form
    ref="domUrlForm"
    @submit.prevent="createFromHtmlOrJson(newRecipeData, importKeywordsAsTags, importCategories, newRecipeUrl)"
  >
    <div>
      <v-card-title class="headline">
        {{ $t('recipe.import-from-html-or-json') }}
      </v-card-title>
      <v-card-text>
        <p>
          {{ $t("recipe.import-from-html-or-json-description") }}
        </p>
        <p>
          {{ $t("recipe.json-import-format-description-colon") }}
          <a href="https://schema.org/Recipe" target="_blank" class="text-primary">https://schema.org/Recipe</a>
        </p>
        <p v-if="aiEnabled">
          {{ $t("recipe.import-from-html-or-json-have-ai-read-it") }}
          <router-link :to="aiImporterTarget" class="text-primary">{{ $t("recipe.import-with-ai") }}</router-link>.
        </p>
        <v-switch
          v-model="state.isEditJSON"
          :label="$t('recipe.json-editor')"
          color="primary"
          class="mt-2"
          @change="handleIsEditJson"
        />
        <v-text-field
          v-model="newRecipeUrl"
          class="my-3"
          :label="$t('new-recipe.recipe-url')"
          :prepend-inner-icon="$globals.icons.link"
          validate-on="blur"
          density="compact"
          variant="filled"
          clearable
          :rules="[validators.urlOptional]"
          :hint="$t('new-recipe.copy-and-paste-the-source-url-of-your-data-optional')"
          persistent-hint
          style="--v-input-control-height: 60px"
        />
        <RecipeJsonEditor
          v-if="state.isEditJSON"
          v-model="newRecipeData"
          height="250px"
          mode="code"
          :main-menu-bar="false"
        />
        <v-textarea
          v-else
          v-model="newRecipeData"
          :label="$t('new-recipe.recipe-html-or-json')"
          :prepend-inner-icon="$globals.icons.codeTags"
          validate-on="blur"
          density="compact"
          autofocus
          variant="filled"
          clearable
          style="--v-input-control-height: 60px"
        />
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
      <v-card-actions class="justify-center">
        <div style="width: 100%" class="text-center">
          <div style="width: 250px; margin: 0 auto">
            <BaseButton :disabled="!newRecipeData" rounded block type="submit" :loading="state.loading" />
          </div>
          <v-card-text class="py-2">
            <!-- render &nbsp; to maintain layout -->
            {{ createStatus }}&nbsp;
          </v-card-text>
        </div>
      </v-card-actions>
      <BaseDialog
        v-model="state.error"
        :title="$t('new-recipe.error-title')"
        :cancel-text="$t('general.close')"
        disable-submit-on-enter
      >
        <v-card-text role="alert" style="overflow-wrap: anywhere;">
          <p v-if="state.errorMessage" class="mb-3">
            {{ state.errorMessage }}
          </p>
          <div>
            <p>
              {{ $t("new-recipe.html-or-json-error-details") }}
            </p>
          </div>
          <div class="d-flex flex-wrap ga-3 justify-space-around my-3">
            <a
              class="text-primary"
              href="https://developers.google.com/search/docs/data-types/recipe"
              target="_blank"
              rel="noreferrer nofollow"
            >
              {{ $t("new-recipe.google-ld-json-info") }}
            </a>
            <a
              class="text-primary"
              href="https://github.com/mealie-recipes/mealie/issues"
              target="_blank"
              rel="noreferrer nofollow"
            >
              {{ $t("new-recipe.github-issues") }}
            </a>
            <a class="text-primary" href="https://schema.org/Recipe" target="_blank" rel="noreferrer nofollow">
              {{ $t("new-recipe.recipe-markup-specification") }}
            </a>
          </div>
        </v-card-text>
      </BaseDialog>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { useRecipeImportUrl } from "~/composables/use-recipe-import-url";
import { recipeImportErrorKey } from "~/lib/recipe/import-errors";
import type { AxiosResponse } from "axios";
import { useTagStore } from "~/composables/store/use-tag-store";
import { useUserApi } from "~/composables/api";
import { useGroupSelf } from "~/composables/use-groups";
import { useNewRecipeOptions } from "~/composables/use-new-recipe-options";
import { validators } from "~/composables/use-validators";
import type { VForm } from "~/types/auto-forms";

const state = reactive({
  error: false,
  errorMessage: "",
  loading: false,
  isEditJSON: false,
});
const auth = useMealieAuth();
const i18n = useI18n();
const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");
const domUrlForm = ref<VForm | null>(null);

const { group } = useGroupSelf();
const aiImporterTarget = computed(() => `/g/${groupSlug.value}/r/create/ai`);
const aiEnabled = computed(() => !!group.value?.aiProviderSettings?.aiEnabled);

const api = useUserApi();
const tags = useTagStore();

const {
  importKeywordsAsTags,
  importCategories,
  stayInEditMode,
  parseRecipe,
  navigateToRecipe,
} = useNewRecipeOptions();

function handleResponse(response: AxiosResponse<string> | null, refreshTags = false) {
  if (response?.status !== 201) {
    state.error = true;
    state.loading = false;
    return;
  }
  if (refreshTags) {
    tags.actions.refresh();
  }

  navigateToRecipe(response.data, groupSlug.value, `/g/${groupSlug.value}/r/create/html`);
}

const newRecipeData = ref<string | object | null>(null);
const newRecipeUrl = useRecipeImportUrl();

function handleIsEditJson() {
  if (state.isEditJSON) {
    if (newRecipeData.value) {
      try {
        newRecipeData.value = JSON.parse(newRecipeData.value as string);
      }
      catch {
        newRecipeData.value = { data: newRecipeData.value };
      }
    }
    else {
      newRecipeData.value = {};
    }
  }
  else if (newRecipeData.value && Object.keys(newRecipeData.value).length > 0) {
    newRecipeData.value = JSON.stringify(newRecipeData.value);
  }
  else {
    newRecipeData.value = null;
  }
}
handleIsEditJson();

const createStatus = ref<string | null>(null);
async function createFromHtmlOrJson(htmlOrJsonData: string | object | null, importKeywordsAsTags: boolean, importCategories: boolean, url: string | null = null) {
  if (!htmlOrJsonData || state.loading) {
    return;
  }

  const isValid = await domUrlForm.value?.validate();
  if (!isValid?.valid) {
    return;
  }

  let dataString;
  if (typeof htmlOrJsonData === "string") {
    dataString = htmlOrJsonData;
  }
  else {
    dataString = JSON.stringify(htmlOrJsonData);
  }

  state.error = false;
  state.errorMessage = "";
  state.loading = true;
  try {
    const { response, error } = await api.recipes.createOneByHtmlOrJson(
      dataString,
      importKeywordsAsTags,
      importCategories,
      url,
      (message: string) => createStatus.value = message,
    );
    if (response?.status !== 201) {
      const key = recipeImportErrorKey(error);
      state.errorMessage = key ? i18n.t(key) : error?.message || "";
    }
    handleResponse(response, importKeywordsAsTags);
  }
  catch (error) {
    const key = recipeImportErrorKey(error);
    state.errorMessage = key ? i18n.t(key) : error instanceof Error ? error.message : "";
    state.error = true;
  }
  finally {
    createStatus.value = null;
    state.loading = false;
  }
}
</script>
