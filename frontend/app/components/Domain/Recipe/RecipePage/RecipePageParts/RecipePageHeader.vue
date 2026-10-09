<template>
  <div>
    <RecipePageInfoCard :recipe="recipe" :recipe-scale="recipeScale" :landscape="landscape" />
    <v-divider />
    <RecipeActionMenu
      :recipe="recipe"
      :slug="recipe.slug"
      :recipe-scale="recipeScale"
      :can-edit="canEditRecipe"
      :name="recipe.name"
      :logged-in="isOwnGroup"
      :open="isEditMode"
      :recipe-id="recipe.id"
      class="pt-3 pb-4"
      @close="$emit('close')"
      @json="toggleEditMode()"
      @edit="enterEditMode"
      @save="$emit('save')"
      @delete="$emit('delete')"
      @print="printRecipe"
      @cook-mode="toggleCookMode()"
    >
      <RecipePageEditorToolbar
        v-if="isEditMode"
        :model-value="recipe"
        @update:model-value="$emit('update:recipe', $event)"
      />
      <template v-if="isEditMode" #owner>
        <RecipePageEditorOwnerSelect :model-value="recipe" @update:model-value="$emit('update:recipe', $event)" />
      </template>
    </RecipeActionMenu>
    <v-overlay :model-value="editLoading" persistent :transition="false" class="align-center justify-center">
      <v-card class="d-flex align-center ga-3 pa-5 rounded-xl" role="status" aria-live="polite" aria-busy="true">
        <BaseLoadingSpinner class="text-primary" />
        <span>{{ $t("general.loading") }}</span>
      </v-card>
    </v-overlay>
    <Teleport to="body">
      <div v-if="isOwnGroup && canEditRecipe && !isCookMode" class="recipe-save-edit d-print-none d-flex ga-3">
        <v-btn
          v-if="isEditMode"
          color="primary"
          variant="tonal"
          size="large"
          elevation="6"
          :icon="$globals.icons.close"
          :aria-label="$t('general.cancel')"
          :title="$t('general.cancel')"
          :disabled="editLoading"
          @click="$emit('close')"
        />
        <v-btn
          color="primary"
          size="large"
          elevation="6"
          :icon="isEditMode ? $globals.icons.save : $globals.icons.edit"
          :aria-label="$t(isEditMode ? 'general.save' : 'general.edit')"
          :title="$t(isEditMode ? 'general.save' : 'general.edit')"
          :loading="editLoading"
          :disabled="editLoading"
          @click="handleSaveEdit"
        >
          <template #loader>
            <BaseLoadingSpinner />
          </template>
        </v-btn>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { RecipeView } from "~/lib/recipe/recipe-view";
import BaseLoadingSpinner from "~/components/global/BaseLoadingSpinner.vue";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import { useRecipePermissions } from "~/composables/recipes";
import RecipePageInfoCard from "~/components/Domain/Recipe/RecipePage/RecipePageParts/RecipePageInfoCard.vue";
import RecipeActionMenu from "~/components/Domain/Recipe/RecipeActionMenu.vue";
import RecipePageEditorToolbar from "~/components/Domain/Recipe/RecipePage/RecipePageParts/RecipePageEditorToolbar.vue";
import RecipePageEditorOwnerSelect from "~/components/Domain/Recipe/RecipePage/RecipePageParts/RecipePageEditorOwnerSelect.vue";
import { useStaticRoutes, useUserApi } from "~/composables/api";
import type { HouseholdSummary } from "~/lib/api/types/household";
import { usePageState, usePageUser, PageMode } from "~/composables/recipe-page/shared-state";

interface Props {
  recipe: RecipeView;
  recipeScale?: number;
  landscape?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  recipeScale: 1,
  landscape: false,
});

const emit = defineEmits(["save", "delete", "print", "close", "update:recipe"]);

const { recipeImage } = useStaticRoutes();
const { imageKey, setMode, toggleEditMode, toggleCookMode, isEditMode, isCookMode } = usePageState(props.recipe.slug);
const editLoading = ref(false);
let headerUnmounted = false;
onBeforeUnmount(() => { headerUnmounted = true; });

// Two animation frames allow the loading state to paint before mounting editors.
function nextPaint() {
  return new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

async function enterEditMode() {
  if (editLoading.value || isEditMode.value) return;
  editLoading.value = true;
  try {
    await nextTick();
    await nextPaint();
    if (headerUnmounted) return;
    setMode(PageMode.EDIT);
    await nextTick();
    await nextPaint();
  }
  finally {
    editLoading.value = false;
  }
}

function handleSaveEdit() {
  if (editLoading.value) return;
  if (isEditMode.value) emit("save");
  else void enterEditMode();
}
const { user } = usePageUser();
const { isOwnGroup } = useLoggedInState();

const recipeHousehold = ref<HouseholdSummary>();
if (user) {
  const userApi = useUserApi();
  userApi.households.getOne(props.recipe.householdId).then(({ data }) => {
    recipeHousehold.value = data || undefined;
  });
}
const { canEditRecipe } = useRecipePermissions(props.recipe, recipeHousehold, user);

function printRecipe() {
  window.print();
}

const hideImage = ref(false);

const recipeImageUrl = computed(() => {
  return recipeImage(props.recipe.id, props.recipe.image, imageKey.value);
});

watch(
  () => recipeImageUrl.value,
  () => {
    hideImage.value = false;
  },
);
</script>

<style scoped>
.recipe-save-edit {
  position: fixed;
  right: calc(16px + env(safe-area-inset-right, 0px));
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  z-index: 10;
}
</style>
