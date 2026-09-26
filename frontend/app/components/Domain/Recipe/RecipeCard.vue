<template>
  <!-- Wrap v-hover with a div to provide a proper DOM element for the transition -->
  <div>
    <v-hover v-slot="{ isHovering, props: hoverProps }" :open-delay="50">
      <v-card v-bind="hoverProps" class="bistro-recipe-card" :class="{ 'on-hover': isHovering }" :style="{ cursor }"
        :elevation="0" :to="recipeRoute" :min-height="imageHeight + 75" @click.self="$emit('click')">
        <RecipeCardImage small :icon-size="imageHeight" :height="imageHeight" :slug="slug" :recipe-id="recipeId"
          :image-version="image" />
        <v-card-title class="px-4" style="font-size: 1.25rem;">
          {{ name }}
        </v-card-title>

        <div class="recipe-card-footer" :class="{ 'recipe-card-footer--no-tags': tags.length === 0 }">
          <RecipeChips v-if="tags.length > 0" class="recipe-card-tags px-4" :truncate="false" :items="tags"
            :title="false" small url-prefix="tags" v-bind="$attrs" />

          <slot name="actions">
            <v-card-actions v-if="showRecipeContent" class="recipe-card-actions px-1 py-0">
              <RecipeRating :model-value="rating" :recipe-id="recipeId" :slug="slug" />
              <!-- If we're not logged-in, no items display, so we hide this menu -->
              <RecipeContextMenu v-if="isOwnGroup && showRecipeContent" color="grey-darken-2" :slug="slug"
                :menu-icon="$globals.icons.dotsVertical" :name="name" :recipe-id="recipeId" :use-items="{
                  delete: false,
                  edit: false,
                  download: true,
                  mealplanner: true,
                  shoppingList: true,
                  print: false,
                  printPreferences: false,
                  share: true,
                }" :leading-items="menuLeadingItems" @favorite="toggleFavorite" @deleted="$emit('delete', slug)" />
            </v-card-actions>
          </slot>
        </div>
        <slot />
      </v-card>
    </v-hover>
  </div>
</template>

<script setup lang="ts">
import RecipeChips from "./RecipeChips.vue";
import RecipeContextMenu from "./RecipeContextMenu/RecipeContextMenu.vue";
import RecipeCardImage from "./RecipeCardImage.vue";
import RecipeRating from "./RecipeRating.vue";
import type { ContextMenuItem } from "./RecipeContextMenu/RecipeContextMenu.vue";
import { useUserApi } from "~/composables/api";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import { useUserSelfRatings } from "~/composables/use-users";
import { playRecipeSynesthesia } from "~/plugins/recipe-synesthesia.client";

interface Props {
  name: string;
  slug: string;
  description?: string | null;
  rating?: number;
  ratingColor?: string;
  image?: string;
  tags?: Array<any>;
  recipeId: string;
  imageHeight?: number;
}
const props = withDefaults(defineProps<Props>(), {
  description: null,
  rating: 0,
  ratingColor: "secondary",
  image: undefined,
  tags: () => [],
  imageHeight: 200,
});

defineEmits<{
  click: [];
  delete: [slug: string];
}>();

const auth = useMealieAuth();
const { isOwnGroup } = useLoggedInState();
const { userRatings, refreshUserRatings } = useUserSelfRatings();
const { $globals } = useNuxtApp();
const { t } = useI18n();

const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug || auth.user.value?.groupSlug || "");
const showRecipeContent = computed(() => props.recipeId && props.slug);
const recipeRoute = computed<string>(() => {
  return showRecipeContent.value ? `/g/${groupSlug.value}/r/${props.slug}` : "";
});
const cursor = computed(() => showRecipeContent.value ? "pointer" : "auto");
const isFavorite = computed(() => userRatings.value.find(rating => rating.recipeId === props.recipeId)?.isFavorite || false);
const menuLeadingItems = computed<ContextMenuItem[]>(() => [
  {
    title: t(isFavorite.value ? "recipe.remove-from-favorites" : "recipe.add-to-favorites"),
    icon: isFavorite.value ? $globals.icons.heart : $globals.icons.heartOutline,
    event: "favorite",
    isPublic: false,
  },
]);

async function toggleFavorite() {
  if (!auth.user.value) return;

  const api = useUserApi();
  if (isFavorite.value) {
    await api.users.removeFavorite(auth.user.value.id, props.recipeId);
  }
  else {
    await api.users.addFavorite(auth.user.value.id, props.recipeId);
    playRecipeSynesthesia();
  }
  await refreshUserRatings();
}
</script>

<style>
.headerClass {
  white-space: nowrap;
  word-break: normal;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recipe-card-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: flex-end;
  min-height: 84px;
}

.recipe-card-footer--no-tags {
  justify-content: center;
}

.recipe-card-tags {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.recipe-card-tags .v-chip {
  flex: 0 0 auto;
  margin: 0 !important;
}

.recipe-card-tags .v-chip__content {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-card-actions {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: 100%;
}

.recipe-card-actions> :first-child {
  grid-column: 2;
}

.recipe-card-actions> :last-child {
  grid-column: 3;
  justify-self: end;
  margin-right: -16px;
}
</style>
