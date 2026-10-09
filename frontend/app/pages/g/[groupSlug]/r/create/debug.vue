<template>
  <div>
    <v-form ref="domUrlForm" @submit.prevent="debugUrl(recipeUrl)">
      <div>
        <v-card-title class="headline">
          {{ $t('recipe.recipe-debugger') }}
        </v-card-title>
        <v-card-text>
          {{ $t('recipe.recipe-debugger-description') }}
          <v-text-field
            v-model="recipeUrl"
            class="my-3"
            :label="$t('new-recipe.recipe-url')"
            validate-on="blur"
            :prepend-inner-icon="$globals.icons.link"
            density="compact"
            autofocus
            variant="filled"
            clearable
            style="--v-input-control-height: 60px"
            :rules="[validators.url]"
            :hint="$t('new-recipe.url-form-hint')"
            persistent-hint
          />
        </v-card-text>
        <v-card-text v-if="group?.aiProviderSettings?.aiEnabled">
          {{ $t('recipe.recipe-debugger-use-openai-description') }}
          <v-checkbox v-model="state.useOpenAI" :label="$t('recipe.use-openai')" />
        </v-card-text>
        <v-card-actions class="justify-center">
          <div style="width: 250px">
            <BaseButton
              :disabled="recipeUrl === null"
              rounded
              block
              type="submit"
              color="info"
              :loading="state.loading"
            >
              <template #icon>
                {{ $globals.icons.robot }}
              </template>
              {{ $t('recipe.debug') }}
            </BaseButton>
          </div>
        </v-card-actions>
      </div>
    </v-form>
    <section v-if="debugData">
      <v-checkbox v-model="debugTreeView" :label="$t('recipe.tree-view')" />
      <RecipeJsonEditor
        v-model="debugData"
        height="700px"
        :mode="debugTreeView ? 'tree' : 'text'"
        :main-menu-bar="false"
        :read-only="true"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRecipeImportUrl } from "~/composables/use-recipe-import-url";
import { useUserApi } from "~/composables/api";
import { useGroupSelf } from "~/composables/use-groups";
import { validators } from "~/composables/use-validators";
import type { Recipe } from "~/lib/api/types/recipe";

const state = reactive({
  loading: false,
  useOpenAI: false,
});

const api = useUserApi();

const { group } = useGroupSelf();

const recipeUrl = useRecipeImportUrl();

const debugTreeView = ref(false);

const debugData = ref<Recipe | null>(null);

async function debugUrl(url: string | null) {
  if (url === null) {
    return;
  }

  state.loading = true;

  const { data } = await api.recipes.testCreateOneUrl(url, state.useOpenAI);

  state.loading = false;
  debugData.value = data;
}
</script>
