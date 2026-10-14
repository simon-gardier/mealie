<template>
  <v-form ref="domUrlForm" class="ai-import-form" @submit.prevent="createRecipe">
    <div class="recipe-url-form ai-import-panel">
      <v-card-title class="ai-import-heading d-flex align-center ga-2">
        {{ $t('recipe.import-with-ai') }}
        <v-menu location="bottom end" :close-on-content-click="false" max-width="480">
          <template #activator="{ props: helpProps }">
            <v-btn
              v-bind="helpProps"
              icon
              variant="text"
              size="small"
              type="button"
              :aria-label="$t('recipe.ai-import-help')"
            >
              <v-icon :icon="$globals.icons.informationOutline" />
            </v-btn>
          </template>
          <v-card>
            <v-card-text class="ai-import-help">
              <p>{{ $t('recipe.import-with-ai-description') }}</p>
              <p v-if="videosEnabled">
                {{ $t('recipe.import-with-ai-video-description') }}
              </p>
              <p>
                <router-link :to="urlImporterTarget">{{ $t('recipe.import-with-ai-use-url-import') }}</router-link>
              </p>
              <p>
                <router-link :to="htmlOrJsonImporterTarget">{{ $t('recipe.scrape-recipe-you-can-import-from-raw-data-directly') }}</router-link>
              </p>
            </v-card-text>
          </v-card>
        </v-menu>
      </v-card-title>
      <v-card-text v-if="!aiEnabled">
        <v-alert type="info" variant="tonal">
          {{ $t('recipe.import-with-ai-provider-required') }}
        </v-alert>
      </v-card-text>
      <v-card-text v-else class="ai-import-sources">
        <p class="ai-import-intro">
          {{ $t('recipe.ai-import-intro') }}
        </p>
        <v-text-field
          v-model="recipeUrl"
          :label="$t('new-recipe.recipe-url')"
          :prepend-inner-icon="$globals.icons.link"
          variant="filled"
          validate-on="blur"
          clearable
          :rules="[validators.urlOptional]"
          :hint="$t('recipe.import-with-ai-url-hint')"
          persistent-hint
          class="ai-import-url"
          :disabled="state.loading"
        />

        <v-tabs
          v-model="state.isEditJSON"
          color="primary"
          class="editor-tabs"
          :disabled="state.loading"
          @update:model-value="handleIsEditJson"
        >
          <v-tab :value="false">
            {{ $t('recipe.text-editor') }}
          </v-tab>
          <v-tab :value="true">
            {{ $t('recipe.json-editor') }}
          </v-tab>
        </v-tabs>
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
          :label="$t('recipe.import-with-ai-content')"
          :prepend-inner-icon="$globals.icons.textBox"
          variant="filled"
          validate-on="blur"
          clearable
          rows="5"
          :hint="$t('recipe.import-with-ai-content-hint')"
          persistent-hint
          :disabled="state.loading"
        />

        <div v-if="imagesEnabled" class="ai-import-images">
          <RecipeImportImages v-model="uploadedImages" :disabled="state.loading" calm />
        </div>
        <v-alert
          v-else
          type="info"
          variant="tonal"
          class="mt-6"
        >
          {{ $t('recipe.import-with-ai-image-provider-required') }}
        </v-alert>

        <div class="ai-import-options">
          <v-menu location="bottom start" :close-on-content-click="false" max-width="480">
            <template #activator="{ props: optionsProps }">
              <v-btn v-bind="optionsProps" variant="text" type="button" :append-icon="$globals.icons.chevronDown" :disabled="state.loading">
                {{ $t('recipe.editor.import-options') }}
              </v-btn>
            </template>
            <v-card>
              <v-card-text class="ai-import-options-list">
                <v-checkbox
                  v-model="translateRecipe"
                  color="primary"
                  hide-details
                  :label="$t('recipe.should-translate-description')"
                  :disabled="state.loading"
                />
                <div class="d-flex align-center">
                  <v-checkbox
                    v-model="createNewOrganizers"
                    color="primary"
                    hide-details
                    :label="$t('recipe.create-new-organizers')"
                    :disabled="state.loading"
                  />
                  <v-tooltip location="bottom" max-width="300">
                    <template #activator="{ props: tooltipProps }">
                      <v-icon v-bind="tooltipProps" size="small" class="ms-2">
                        {{ $globals.icons.help }}
                      </v-icon>
                    </template>
                    <span>{{ $t('recipe.create-new-organizers-hint') }}</span>
                  </v-tooltip>
                </div>
                <v-checkbox
                  v-model="stayInEditMode"
                  color="primary"
                  hide-details
                  :label="$t('recipe.stay-in-edit-mode')"
                  :disabled="state.loading"
                />
                <v-checkbox
                  v-model="parseRecipe"
                  color="primary"
                  hide-details
                  :label="$t('recipe.parse-recipe-ingredients-after-import')"
                  :disabled="state.loading"
                />
              </v-card-text>
            </v-card>
          </v-menu>
        </div>
      </v-card-text>
      <v-card-actions v-if="aiEnabled" class="ai-import-footer">
        <v-btn
          :disabled="!hasSource || state.loading"
          :loading="state.loading"
          variant="tonal"
          color="primary"
          :prepend-icon="$globals.icons.autoFix"
          class="ai-import-create"
          type="submit"
        >
          {{ $t('recipe.ai-import-create') }}
        </v-btn>
        <p v-if="createStatus" class="ai-import-status" role="status" aria-live="polite">
          {{ createStatus }}
        </p>
      </v-card-actions>
      <v-expand-transition>
        <v-alert
          v-if="state.error"
          type="error"
          variant="tonal"
          class="mt-6"
        >
          <v-card-title class="ma-0 pa-0">
            <v-icon
              start
              color="error"
              size="x-large"
            >
              {{ $globals.icons.robot }}
            </v-icon>
            {{ $t("new-recipe.error-title") }}
          </v-card-title>
          <v-divider class="my-3 mx-2" />

          <div>
            <p>{{ state.errorMessage || $t("recipe.import-with-ai-error-details") }}</p>
          </div>
        </v-alert>
      </v-expand-transition>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { useRecipeImportUrl } from "~/composables/use-recipe-import-url";
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
  errorMessage: "",
  loading: false,
  isEditJSON: false,
});

const i18n = useI18n();
const api = useUserApi();
const auth = useMealieAuth();
const route = useRoute();
const tags = useTagStore();
const { group } = useGroupSelf();

const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");
const urlImporterTarget = computed(() => `/g/${groupSlug.value}/r/create/url`);
const htmlOrJsonImporterTarget = computed(() => `/g/${groupSlug.value}/r/create/html`);
const aiEnabled = computed(() => !!group.value?.aiProviderSettings?.aiEnabled);
const imagesEnabled = computed(() => !!group.value?.aiProviderSettings?.imageProviderEnabled);
const videosEnabled = computed(() => !!group.value?.aiProviderSettings?.audioProviderEnabled);

const domUrlForm = ref<VForm | null>(null);
const recipeUrl = useRecipeImportUrl();
const newRecipeData = ref<string | object | null>(null);
const uploadedImages = ref<(Blob | File)[]>([]);
const createStatus = ref<string | null>(null);

const {
  stayInEditMode,
  parseRecipe,
  translateRecipe,
  createNewOrganizers,
  navigateToRecipe,
} = useNewRecipeOptions({
  enableImportKeywords: false,
  enableImportCategories: false,
  enableTranslateRecipe: true,
  enableCreateNewOrganizers: true,
});

const contentAsString = computed(() => {
  const data = newRecipeData.value;
  if (!data) {
    return null;
  }

  return typeof data === "string" ? data : JSON.stringify(data);
});

const hasSource = computed(() => !!(recipeUrl.value || contentAsString.value || uploadedImages.value.length));

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

async function createRecipe() {
  if (!hasSource.value || state.loading) {
    return;
  }

  const isValid = await domUrlForm.value?.validate();
  if (!isValid?.valid) {
    return;
  }

  state.error = false;
  state.errorMessage = "";
  state.loading = true;

  const { data, error } = await api.recipes.createOneWithAI(
    {
      content: contentAsString.value,
      url: recipeUrl.value,
      images: uploadedImages.value,
      translateLanguage: translateRecipe.value ? i18n.locale.value : null,
      createNewOrganizers: createNewOrganizers.value,
    },
    (message: string) => createStatus.value = message,
  );

  createStatus.value = null;

  if (error || !data) {
    state.error = true;
    state.errorMessage = error?.message || "";
    state.loading = false;
    return;
  }

  if (createNewOrganizers.value) {
    tags.actions.refresh();
  }

  navigateToRecipe(data, groupSlug.value, `/g/${groupSlug.value}/r/create/ai`);
}
</script>

<style scoped>
.ai-import-form {
  max-width: 800px;
  margin-inline: auto;
  font-family: var(--bistro-body);
}
.ai-import-panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-separator), 0.5);
  border-radius: 14px;
  padding: 24px;
}
.ai-import-heading {
  padding: 0;
  font: 600 18px/1.4 var(--bistro-body) !important;
  white-space: normal;
  color: rgb(var(--v-theme-on-surface));
}
.ai-import-sources {
  padding: 16px 0 0;
  font-size: 15px;
  line-height: 1.5;
}
.ai-import-intro {
  color: rgb(var(--v-theme-text-secondary));
  margin-bottom: 24px;
}
.ai-import-url {
  margin-bottom: 24px;
}
.ai-import-help {
  color: rgb(var(--v-theme-text-secondary));
  font: 400 14px/1.5 var(--bistro-body);
}
.ai-import-help p + p {
  margin-top: 12px;
}
.ai-import-form :deep(.v-messages) {
  font-size: 13px;
  line-height: 1.4;
  color: rgb(var(--v-theme-text-secondary));
}
.editor-tabs {
  width: fit-content;
  max-width: 100%;
  margin-bottom: 12px;
  padding: 4px;
  height: 52px;
  border-radius: 12px;
  background: rgba(var(--v-theme-fill), 0.6);
}
.editor-tabs :deep(.v-tab) {
  min-height: 44px;
  height: 44px;
  border-radius: 8px !important;
  font: 500 14px var(--bistro-body);
  text-transform: none;
  color: rgb(var(--v-theme-text-secondary));
}
.editor-tabs :deep(.v-tab--selected) {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  box-shadow: 0 1px 4px rgba(var(--v-theme-shadow), 0.12);
}
.editor-tabs :deep(.v-tab__slider) {
  display: none;
}
.ai-import-images {
  margin-top: 24px;
  padding: 16px;
  border: 1px dashed rgb(var(--v-theme-separator));
  border-radius: 12px;
  background: rgba(var(--v-theme-fill), 0.2);
}
.ai-import-options {
  margin-top: 16px;
}
.ai-import-options-list :deep(.v-label) {
  white-space: normal;
  font: 400 14px/1.4 var(--bistro-body);
}
.ai-import-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0 0;
}
.ai-import-create {
  min-height: 44px;
  height: auto;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  text-transform: none;
}
.ai-import-create :deep(.v-btn__content) {
  white-space: normal;
}
.ai-import-status {
  flex-basis: 100%;
  color: rgb(var(--v-theme-text-secondary));
  font-size: 14px;
}
@media (max-width: 599px) {
  .ai-import-panel {
    padding: 16px;
  }
  .ai-import-create {
    width: 100%;
  }
}
</style>
