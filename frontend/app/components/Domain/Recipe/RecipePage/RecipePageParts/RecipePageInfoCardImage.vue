<template>
  <div
    v-if="!hideImage"
    :key="imageKey"
    class="recipe-image-frame d-print-none"
    :style="frameStyle"
    v-bind="$attrs"
    @click="openLightbox"
  >
    <v-img cover :src="recipeImageUrl" class="recipe-image-frame__image" @error="hideImage = true" />
  </div>
  <RecipeImageLightbox
    v-if="lightboxOpen"
    v-model="lightboxOpen"
    v-model:index="lightboxIndex"
    :items="lightboxItems"
  />
</template>

<script setup lang="ts">
import type { RecipeView } from "~/lib/recipe/recipe-view";
import { useStaticRoutes, useUserApi } from "~/composables/api";
import type { HouseholdSummary } from "~/lib/api/types/household";
import { usePageState, usePageUser } from "~/composables/recipe-page/shared-state";
import { useRecipeLightboxItems } from "~/composables/recipe-page/use-recipe-lightbox-items";

interface Props {
  recipe: RecipeView;
  maxWidth?: string;
}
const props = withDefaults(defineProps<Props>(), {
  maxWidth: undefined,
});

const display = useDisplay();
const { recipeImage, recipeSmallImage } = useStaticRoutes();
const { imageKey } = usePageState(props.recipe.slug);
const { user } = usePageUser();

const recipeHousehold = ref<HouseholdSummary>();
if (user) {
  const userApi = useUserApi();
  userApi.households.getOne(props.recipe.householdId).then(({ data }) => {
    recipeHousehold.value = data || undefined;
  });
}

const hideImage = ref(false);
const lightboxOpen = ref(false);
const lightboxIndex = ref(0);

const { buildItems } = useRecipeLightboxItems();
const lightboxItems = computed(() => buildItems(props.recipe.id, {
  heroUrl: recipeFullImageUrl.value,
  heroAlt: props.recipe.name,
  assets: props.recipe.assets,
}));

function openLightbox() {
  if (hideImage.value) {
    return;
  }
  lightboxIndex.value = 0;
  lightboxOpen.value = true;
}

const frameStyle = computed(() => ({
  maxWidth: props.maxWidth ? `min(${props.maxWidth}, 504px)` : "504px",
}));

const recipeFullImageUrl = computed(() => {
  return recipeImage(props.recipe.id, props.recipe.image, imageKey.value);
});

const recipeImageUrl = computed(() => {
  return display.smAndDown.value
    ? recipeSmallImage(props.recipe.id, props.recipe.image, imageKey.value)
    : recipeFullImageUrl.value;
});

watch(
  () => recipeImageUrl.value,
  () => {
    hideImage.value = false;
  },
);
</script>

<style scoped>
.recipe-image-frame {
  aspect-ratio: 1248 / 990;
  cursor: zoom-in;
  isolation: isolate;
  position: relative;
  width: 100%;
}

.recipe-image-frame__image {
  background: transparent;
  bottom: 7.071%;
  /* wider inset than the frame's outer edge so the photo stays behind the vine border instead of peeking out on the sides */
  left: 9%;
  position: absolute;
  right: 9%;
  top: 9.091%;
  z-index: 0;
}

.recipe-image-frame::after {
  background: url("~/assets/frame.png") center / 100% 100% no-repeat;
  content: "";
  inset: 0;
  pointer-events: none;
  position: absolute;
  z-index: 1;
}
</style>
