<template>
  <div class="d-flex editor-actions">
    <v-tooltip location="bottom">
      <template #activator="{ props: tooltipProps }">
        <RecipeImageUploadBtn :slug="recipe.slug" v-bind="tooltipProps" @upload="uploadImage" @refresh="refreshImage"
          @delete="deleteImage" />
      </template>
      <span>{{ $t("general.image") }}</span>
    </v-tooltip>
    <v-tooltip location="bottom">
      <template #activator="{ props: tooltipProps }">
        <RecipeSettingsMenu v-model="recipe.settings" :is-owner="recipe.userId == user.id" v-bind="tooltipProps"
          @upload="uploadImage" />
      </template>
      <span>{{ $t("general.settings") }}</span>
    </v-tooltip>
  </div>
</template>

<script setup lang="ts">
import { usePageState, usePageUser } from "~/composables/recipe-page/shared-state";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import type { Recipe } from "~/lib/api/types/recipe";
import { useUserApi } from "~/composables/api";
import { alertUnreportedError } from "~/composables/use-toast";
import RecipeImageUploadBtn from "~/components/Domain/Recipe/RecipeImageUploadBtn.vue";
import RecipeSettingsMenu from "~/components/Domain/Recipe/RecipeSettingsMenu.vue";

const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });

const { user } = usePageUser();
const api = useUserApi();
const i18n = useI18n();
const { imageKey } = usePageState(recipe.value.slug);

async function uploadImage(fileObject: File) {
  if (!recipe.value || !recipe.value.slug) {
    return;
  }
  const { data, error } = await api.recipes.updateImage(recipe.value.slug, fileObject);
  if (error) {
    alertUnreportedError(error, i18n.t("events.something-went-wrong"));
    return;
  }

  if (data?.image) {
    recipe.value.image = data.image;
  }
  imageKey.value++;
}

function refreshImage(image: string) {
  if (image) {
    recipe.value.image = image;
  }
  imageKey.value++;
}

async function deleteImage() {
  // The image is already deleted on the backend, just need to update the UI
  recipe.value.image = "";
  imageKey.value++;
}
</script>

<style scoped>
.editor-actions {
  gap: 0.25rem;
}
</style>
