<template>
  <div :style="listMode || compact ? undefined : `height: ${height}px;`">
    <v-expand-transition>
      <v-card class="bistro-recipe-card" :ripple="false" :class="[
        isFlat ? 'mx-auto flat' : 'mx-auto',
        { 'disable-highlight': disableHighlight, 'recipe-list-card': listMode, 'recipe-compact-card': compact },
      ]" :style="{ cursor }" hover :height="listMode || compact ? undefined : '100%'"
        :to="$attrs.selected ? undefined : recipeRoute" @click="$emit('selected')">
        <v-img v-if="vertical" class="rounded-sm" cover>
          <RecipeCardImage tiny :icon-size="100" :slug="slug" :recipe-id="recipeId" :image-version="image"
            :height="height" />
        </v-img>
        <v-list-item :lines="listMode || compact ? undefined : 'two'" class="py-0" :class="[
          vertical ? 'px-2' : 'px-0',
          { 'recipe-list-item': listMode, 'recipe-compact-item': compact },
        ]" item-props :height="listMode || compact ? undefined : '100%'" density="compact">
          <template #prepend>
            <slot v-if="!vertical" name="avatar">
              <div :class="{
                'recipe-list-image-wrapper': listMode,
                'recipe-compact-image-wrapper': compact,
                'recipe-compact-image-wrapper--placeholder': compact && !image,
              }" @click="openImage">
                <RecipeCardImage tiny :icon-size="compact ? 32 : 100" :slug="slug" :recipe-id="recipeId"
                  :image-version="image" class="recipe-list-image"
                  :width="listMode ? undefined : compact ? '88' : '125'" :height="listMode || compact ? '100%' : height"
                  :min-height="compact ? 0 : undefined" />
                <RecipeRating v-if="listMode && showRecipeContent" class="recipe-list-image-rating"
                  :model-value="rating" :recipe-id="recipeId" :slug="slug" small />
              </div>
            </slot>
          </template>
          <div class="recipe-card-mobile__content pl-4 d-flex flex-column ga-2 align-stretch pr-2"
            :class="{ 'recipe-list-content': listMode }">
            <div :class="{ 'recipe-list-title-row': listMode }">
              <v-list-item-title class="recipe-card-mobile__title ma-0 text-top w-100"
                :class="listMode ? 'recipe-list-title' : compact ? 'recipe-compact-title' : 'text-truncate'">
                {{ name }}
              </v-list-item-title>
            </div>
            <v-list-item-subtitle v-if="!compact && showDescription" class="ma-0 text-top"
              :class="{ 'recipe-list-description': listMode }">
              <SafeMarkdown v-if="description" :source="description" />
              <p v-else class="recipe-card-empty-message">{{ t("recipe.no-description") }}</p>
            </v-list-item-subtitle>
            <div v-if="!compact" class="d-flex justify-start ma-0 pa-0"
              :class="listMode ? 'recipe-list-tags flex-nowrap' : 'flex-nowrap'"
              :style="listMode ? undefined : 'overflow-x: hidden; overflow-y: hidden; white-space: nowrap;'">
              <RecipeChips v-if="tags.length" :truncate="!listMode" :items="tags" :title="false"
                :limit="listMode ? undefined : 2" small url-prefix="tags" v-bind="$attrs" />
              <span v-else class="recipe-card-empty-message">{{ t("recipe.no-tags") }}</span>
            </div>
          </div>
          <slot name="actions">
            <v-card-actions class="recipe-card-actions w-100 my-0 px-1 py-0"
              :class="{ 'recipe-list-actions': listMode }">
              <RecipeFavoriteBadge v-if="!compact && !listMode && isOwnGroup && showRecipeContent" :recipe-id="recipeId"
                show-always class="ma-0 pa-0" />
              <div v-else-if="!compact && !listMode" class="my-0 px-1 py-0" />
              <!-- Empty div to keep the layout consistent -->
              <RecipeCardRating v-if="!compact && !listMode && showRecipeContent"
                :class="[{ 'pb-2': !isOwnGroup }, 'ml-n2']" :model-value="rating" :recipe-id="recipeId" />

              <!-- If we're not logged-in, no items display, so we hide this menu -->
              <!-- We also add padding to the v-rating above to compensate -->
              <template v-if="compact">
                <v-tooltip open-delay="200" transition="slide-y-reverse-transition" density="compact" location="bottom"
                  content-class="text-caption">
                  <template #activator="{ props: tooltipProps }">
                    <v-btn :icon="$globals.icons.calendarRemove" class="recipe-compact-action" variant="text"
                      size="default" :aria-label="t('meal-plan.remove-from-plan')" v-bind="tooltipProps"
                      @click.stop="$emit('mealplanRemove')" />
                  </template>
                  <span>{{ t("meal-plan.remove-from-plan") }}</span>
                </v-tooltip>
                <v-tooltip open-delay="200" transition="slide-y-reverse-transition" density="compact" location="bottom"
                  content-class="text-caption">
                  <template #activator="{ props: tooltipProps }">
                    <v-btn :icon="$globals.icons.calendarEdit" class="recipe-compact-action" variant="text"
                      size="default" :aria-label="t('meal-plan.edit-meal-plan')" v-bind="tooltipProps"
                      @click.stop="$emit('mealplanEdit')" />
                  </template>
                  <span>{{ t("meal-plan.edit-meal-plan") }}</span>
                </v-tooltip>
                <v-tooltip v-if="showRecipeContent" open-delay="200" transition="slide-y-reverse-transition"
                  density="compact" location="bottom" content-class="text-caption">
                  <template #activator="{ props: tooltipProps }">
                    <v-btn :icon="$globals.icons.cartCheck" class="recipe-compact-action" variant="text" size="default"
                      :aria-label="t('recipe.add-to-list')" v-bind="tooltipProps"
                      @click.stop="$emit('addToShoppingList')" />
                  </template>
                  <span>{{ t("recipe.add-to-list") }}</span>
                </v-tooltip>
              </template>
              <slot v-else name="context-menu">
                <RecipeContextMenu v-if="isOwnGroup && showRecipeContent"
                  :key="listMode ? `${recipeId}-${isFavorite}` : recipeId" :slug="slug"
                  :menu-icon="listMode ? $globals.icons.dotsVertical : $globals.icons.dotsHorizontal" :name="name"
                  :recipe-id="recipeId" :class="listMode ? 'recipe-list-menu' : 'ml-auto'" :use-items="contextMenuItems"
                  :leading-items="listMode ? listMenuLeadingItems : contextMenuLeadingItems"
                  :append-items="contextMenuAppendItems" @favorite="toggleFavorite" @deleted="$emit('delete', slug)"
                  @mealplan-remove="$emit('mealplanRemove')" @mealplan-edit="$emit('mealplanEdit')" />
              </slot>
            </v-card-actions>
          </slot>
        </v-list-item>
        <slot />
      </v-card>
    </v-expand-transition>
    <RecipeImageLightbox v-if="lightboxOpen" v-model="lightboxOpen" :image-url="fullImageUrl" :image-alt="name" />
  </div>
</template>

<script setup lang="ts">
import { useLoggedInState } from "~/composables/use-logged-in-state";
import RecipeCardImage from "./RecipeCardImage.vue";
import RecipeCardRating from "./RecipeCardRating.vue";
import RecipeRating from "./RecipeRating.vue";
import RecipeImageLightbox from "./RecipeImageLightbox.vue";
import RecipeChips from "./RecipeChips.vue";
import RecipeContextMenu from "./RecipeContextMenu/RecipeContextMenu.vue";
import RecipeFavoriteBadge from "./RecipeFavoriteBadge.vue";
import type { ContextMenuItem } from "./RecipeContextMenu/RecipeContextMenu.vue";
import { useStaticRoutes, useUserApi } from "~/composables/api";
import { useUserSelfRatings } from "~/composables/use-users";
import { playRecipeSynesthesia } from "~/plugins/recipe-synesthesia.client";

interface Props {
  name: string;
  slug: string;
  description: string;
  rating?: number;
  image?: string;
  tags?: Array<any>;
  recipeId: string;
  vertical?: boolean;
  isFlat?: boolean;
  height?: number;
  disableHighlight?: boolean;
  showDescription?: boolean;
  listMode?: boolean;
  compact?: boolean;
  contextMenuUseItems?: {
    share?: boolean;
  };
  contextMenuAppendItems?: ContextMenuItem[];
  contextMenuLeadingItems?: ContextMenuItem[];
}
const props = withDefaults(defineProps<Props>(), {
  rating: 0,
  image: undefined,
  tags: () => [],
  vertical: false,
  isFlat: false,
  height: 150,
  disableHighlight: false,
  showDescription: true,
  listMode: false,
  compact: false,
  contextMenuUseItems: () => ({}),
  contextMenuAppendItems: () => [],
  contextMenuLeadingItems: () => [],
});

defineEmits<{
  mealplanRemove: [];
  mealplanEdit: [];
  addToShoppingList: [];
  selected: [];
  delete: [slug: string];
}>();

const auth = useMealieAuth();
const { isOwnGroup } = useLoggedInState();
const { userRatings, refreshUserRatings } = useUserSelfRatings();
const { $globals } = useNuxtApp();
const { t } = useI18n();
const { recipeImage } = useStaticRoutes();

const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug || auth.user.value?.groupSlug || "");
const contextMenuItems = computed(() => ({
  delete: false,
  edit: false,
  download: true,
  mealplanner: true,
  shoppingList: true,
  print: false,
  printPreferences: false,
  share: true,
  ...props.contextMenuUseItems,
}));
const showRecipeContent = computed(() => props.recipeId && props.slug);
const recipeRoute = computed<string>(() => {
  return showRecipeContent.value ? `/g/${groupSlug.value}/r/${props.slug}` : "";
});
const cursor = computed(() => showRecipeContent.value ? "pointer" : "auto");
const lightboxOpen = ref(false);
const fullImageUrl = computed(() => props.image ? recipeImage(props.recipeId, props.image) : undefined);
const isFavorite = computed(() => userRatings.value.find(rating => rating.recipeId === props.recipeId)?.isFavorite || false);
const listMenuLeadingItems = computed<ContextMenuItem[]>(() => [
  {
    title: t(isFavorite.value ? "recipe.remove-from-favorites" : "recipe.add-to-favorites"),
    icon: isFavorite.value ? $globals.icons.heart : $globals.icons.heartOutline,
    event: "favorite",
    isPublic: false,
  },
  ...props.contextMenuLeadingItems,
]);

function openImage(event: MouseEvent) {
  if (!props.compact || !props.image) return;

  event.preventDefault();
  event.stopPropagation();
  lightboxOpen.value = true;
}

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

<style scoped>
:deep(.v-list-item__prepend) {
  height: 100%;
}

.v-mobile-img {
  padding-top: 0;
  padding-bottom: 0;
  padding-left: 0;
}

.v-card--reveal {
  align-items: center;
  bottom: 0;
  justify-content: center;
  opacity: 0.8;
  position: absolute;
  width: 100%;
}

.v-card--text-show {
  opacity: 1 !important;
}

.headerClass {
  white-space: nowrap;
  word-break: normal;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-top {
  align-self: start !important;
}

.flat,
.theme--dark .flat {
  box-shadow: none !important;
  background-color: transparent !important;
}

.disable-highlight :deep(.v-card__overlay) {
  opacity: 0 !important;
}

.recipe-card-actions {
  gap: 0;
  min-width: 0;
}

.recipe-compact-card {
  height: 96px;
  min-height: 96px;
  position: relative;
}

.recipe-compact-item {
  height: 100%;
  padding-inline-end: 0 !important;
  position: relative;
}

.recipe-compact-item :deep(.v-list-item__content) {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-width: 0;
}

.recipe-compact-item :deep(.v-list-item__prepend) {
  align-self: stretch;
  height: 100%;
  margin-inline-end: 0;
  min-width: 88px;
  width: 88px;
}

.recipe-compact-image-wrapper {
  align-self: stretch;
  box-sizing: border-box;
  flex: 0 0 88px;
  height: 100%;
  width: 88px;
}

.recipe-compact-image-wrapper--placeholder {
  padding-inline: 10px;
}

.recipe-compact-item :deep(.recipe-list-image) {
  height: 100% !important;
  min-height: 0 !important;
}

.recipe-compact-item :deep(.icon-position) {
  transform: translateX(8px);
}

.recipe-compact-card .recipe-card-mobile__content {
  inset: auto;
  position: static;
  flex: 1 1 auto;
  height: auto;
  justify-content: center;
  min-width: 0;
  padding: 0 0.75rem !important;
  width: 100% !important;
}

.recipe-compact-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: normal;
}

.recipe-compact-card .recipe-card-actions {
  align-items: center;
  flex: 0 0 32px;
  gap: 0;
  height: 32px;
  justify-content: flex-end;
  margin: 0;
  min-height: 0 !important;
  padding: 0 4px 0 0 !important;
  position: static;
  width: 100% !important;
  z-index: 1;
}

.recipe-compact-card .recipe-card-actions :deep(.recipe-compact-action) {
  transform: translateY(-4px);
}

.recipe-compact-card .recipe-card-actions :deep(.v-icon) {
  font-size: 18px !important;
}

/* list mode: allow multi-line wrapping, falling back to an inner scrollbar for overly long content */
.recipe-list-title {
  display: block;
  flex: 0 1 auto;
  min-width: 0;
  max-width: calc(100% - 2.5rem);
  width: auto !important;
  overflow-y: auto;
  max-height: 3.2em;
  font-size: 1.5rem;
  line-height: 1.2;
  text-align: center;
  white-space: normal;
  word-break: break-word;
}

.recipe-list-card {
  display: flex;
  min-height: 240px;
  position: relative;
}

.recipe-list-item {
  align-items: stretch;
  flex: 1;
  padding-top: 1rem !important;
  padding-bottom: 1rem !important;
}

.recipe-list-item :deep(.v-list-item__content) {
  align-self: stretch;
  display: flex;
  flex-direction: column;
}

.recipe-list-item :deep(.v-list-item__prepend) {
  align-self: stretch;
  height: auto;
  width: clamp(150px, 22vw, 220px);
  margin-top: -1rem;
  margin-bottom: -1rem;
}

.recipe-list-item :deep(.recipe-list-image) {
  width: 100% !important;
  height: 100% !important;
}

.recipe-list-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.recipe-list-image-rating {
  position: absolute;
  bottom: 0.7rem;
  left: 50%;
  z-index: 1;
  transform: translateX(-50%) scale(1.5);
  transform-origin: bottom center;
}

.recipe-list-image-rating :deep(.v-rating__wrapper) {
  margin-inline: 1px;
}

.recipe-card-empty-message {
  width: 100%;
  text-align: center;
}

.recipe-list-title-row {
  display: flex;
  align-items: start;
  justify-content: center;
  gap: 0.5rem;
  padding-top: 0.5rem;
}

.recipe-list-content {
  flex: 1;
  position: relative;
  gap: 0.85rem !important;
  padding-right: 1.25rem !important;
  padding-left: 1.5rem !important;
}

.recipe-list-actions {
  position: absolute;
  top: 0;
  right: 0;
  width: auto !important;
  margin-top: 0;
  justify-content: center;
  padding-top: 0.5rem !important;
  padding-bottom: 0.25rem !important;
}

.recipe-list-actions :deep(> :last-child) {
  margin-right: 0;
}

.recipe-list-menu {
  position: static;
}

.recipe-list-description {
  display: block;
  position: absolute;
  top: 50%;
  right: 1.25rem;
  left: 1.5rem;
  margin: 0 !important;
  overflow-y: auto;
  max-height: 4.5em;
  white-space: normal;
  word-break: break-word;
  text-align: left;
  transform: translateY(-50%);
  -webkit-line-clamp: unset;
  -webkit-box-orient: unset;
}

.recipe-list-tags {
  flex: 0 0 auto;
  margin-top: auto;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
}

.recipe-list-tags :deep(> div) {
  flex: 0 0 auto;
}

.recipe-list-tags :deep(.v-chip) {
  margin-top: 0 !important;
}

@media (max-width: 600px) {
  .recipe-list-card {
    height: 104px;
    min-height: 0;
  }

  .recipe-list-item {
    align-items: flex-start;
    overflow: hidden;
    padding: 0 0.75rem 0 0 !important;
  }

  .recipe-list-item :deep(.v-list-item__prepend) {
    align-self: flex-start;
    flex: 0 0 104px;
    width: 104px;
    height: 104px;
    margin-top: 0;
    margin-bottom: 0;
  }

  .recipe-list-image-wrapper {
    aspect-ratio: 1;
    height: auto;
  }

  .recipe-list-image-rating {
    bottom: 0.25rem;
    transform: translateX(-50%) scale(0.85);
  }

  .recipe-list-content {
    gap: 0.35rem !important;
    min-height: 104px;
    overflow: hidden;
    padding-top: 0.75rem !important;
    padding-bottom: 0.5rem !important;
    padding-left: 0.75rem !important;
    padding-right: 2rem !important;
  }

  .recipe-list-title-row {
    justify-content: flex-start;
    padding-top: 0;
  }

  .recipe-list-title {
    max-width: 100%;
    max-height: 2.5em;
    overflow: hidden;
    font-size: 1rem;
    line-height: 1.25;
    text-align: left;
  }

  .recipe-list-description {
    display: none;
  }

  .recipe-list-tags {
    margin-top: auto;
    max-width: 100%;
    overflow-x: auto;
  }

  .recipe-list-actions {
    top: 0.25rem;
    right: 0.25rem;
    padding-top: 0 !important;
  }
}
</style>
