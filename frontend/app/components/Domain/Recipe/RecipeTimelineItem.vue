<template>
  <v-timeline-item :class="attrs.class" fill-dot :small="attrs.small" :icon="icon" dot-color="primary">
    <v-card
      :to="$attrs.selected || !recipe ? undefined : `/g/${groupSlug}/r/${recipe.slug}`"
      class="history-event-card"
      elevation="0"
      @click="$emit('selected')"
    >
      <v-card-title class="history-event-heading">
        <UserAvatar :user-id="event.userId" size="36px" />
        <div class="history-event-label">
          <h3>{{ event.subject }}</h3>
          <p v-if="event.timestamp">
            {{ $d(new Date(event.timestamp)) }}
          </p>
        </div>
        <div>
          <RecipeTimelineContextMenu
            v-if="currentUser && currentUser.id == event.userId && event.eventType != 'system'"
            :menu-top="false"
            :event="event"
            :menu-icon="$globals.icons.dotsVertical"
            color="transparent"
            :elevation="0"
            :card-menu="false"
            :use-items="{
              edit: true,
              delete: true,
            }"
            @update="$emit('update', $event)"
            @delete="$emit('delete')"
          />
        </div>
      </v-card-title>
      <v-card-text v-if="showRecipeCards && recipe" class="background">
        <v-row :class="useMobileFormat ? 'py-3 mx-0' : 'py-3 mx-0'" style="max-width: 100%">
          <v-col align-self="center" class="pa-0">
            <RecipeCardMobile
              class="timeline-recipe-card"
              disable-highlight
              :vertical="useMobileFormat"
              :name="recipe.name"
              :slug="recipe.slug"
              :description="recipe.description"
              :rating="recipe.rating"
              :image="recipe.image"
              :recipe-id="recipe.id"
              :is-flat="false"
            >
              <template #actions>
                <div class="timeline-recipe-toolbar" @click.stop.prevent>
                  <RecipeRating
                    v-if="showRecipeContent"
                    class="timeline-recipe-rating"
                    :model-value="recipe.rating"
                    :recipe-id="recipe.id"
                    :slug="recipe.slug"
                  />
                  <div v-if="isOwnGroup && showRecipeContent" class="timeline-recipe-actions">
                    <RecipeFavoriteBadge :recipe-id="recipe.id" show-always />
                    <RecipeContextMenu :slug="recipe.slug" :name="recipe.name" :recipe-id="recipe.id" :menu-icon="$globals.icons.dotsHorizontal" />
                  </div>
                </div>
              </template>
            </RecipeCardMobile>
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider v-if="showRecipeCards && recipe && (useMobileFormat || event.eventMessage)" />
      <v-card-text v-if="eventImageUrl || event.eventMessage" class="history-event-body">
        <v-row>
          <v-col>
            <v-img
              v-if="eventImageUrl"
              :src="eventImageUrl"
              min-height="50"
              :height="hideImage ? undefined : 'auto'"
              :max-height="attrs.image.maxHeight"
              contain
              :class="attrs.image.class"
              @error="hideImage = true"
            />
            <div v-if="event.eventMessage" class="break-word" :class="useMobileFormat ? 'text-caption' : ''">
              <SafeMarkdown :source="event.eventMessage" />
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-timeline-item>
</template>

<script setup lang="ts">
import { useLoggedInState } from "~/composables/use-logged-in-state";
import RecipeCardMobile from "./RecipeCardMobile.vue";
import RecipeTimelineContextMenu from "./RecipeTimelineContextMenu.vue";
import { useStaticRoutes } from "~/composables/api";
import { useTimelineEventTypes } from "~/composables/recipes/use-recipe-timeline-events";
import type { Recipe, RecipeTimelineEventOut, RecipeTimelineEventUpdate } from "~/lib/api/types/recipe";
import UserAvatar from "~/components/Domain/User/UserAvatar.vue";
import SafeMarkdown from "~/components/global/SafeMarkdown.vue";

interface Props {
  event: RecipeTimelineEventOut;
  recipe?: Recipe;
  showRecipeCards?: boolean;
}

const { isOwnGroup } = useLoggedInState();
const props = withDefaults(defineProps<Props>(), {
  recipe: undefined,
  showRecipeCards: false,
});
const showRecipeContent = computed(() => Boolean(props.recipe?.id && props.recipe?.slug));

defineEmits<{
  selected: [];
  update: [event: RecipeTimelineEventUpdate];
  delete: [];
}>();

const { $globals } = useNuxtApp();
const display = useDisplay();
const { recipeTimelineEventSmallImage } = useStaticRoutes();
const { eventTypeOptions } = useTimelineEventTypes();

const { user: currentUser } = useMealieAuth();

const route = useRoute();
const groupSlug = computed(() => (route.params.groupSlug as string) || currentUser?.value?.groupSlug || "");

const useMobileFormat = computed(() => {
  return display.smAndDown.value;
});

const attrs = computed(() => {
  if (useMobileFormat.value) {
    return {
      class: "px-0",
      small: false,
      avatar: {
        size: "30px",
        class: "pr-0",
      },
      image: {
        maxHeight: "250",
        class: "my-3",
      },
    };
  }
  else {
    return {
      class: "px-3",
      small: false,
      avatar: {
        size: "42px",
        class: "",
      },
      image: {
        maxHeight: "300",
        class: "mb-5",
      },
    };
  }
});

const icon = computed(() => {
  const option = eventTypeOptions.value.find(option => option.value === props.event.eventType);
  return option ? option.icon : $globals.icons.informationVariant;
});

const hideImage = ref(false);
const imageVersion = ref(0);
watch(() => props.event, () => { imageVersion.value++; hideImage.value = false; });
const eventImageUrl = computed<string>(() => {
  if (props.event.image !== "has image") {
    return "";
  }

  return `${recipeTimelineEventSmallImage(props.event.recipeId, props.event.id)}?v=${imageVersion.value}`;
});
</script>

<style>
.v-card::after {
  display: none;
}

.break-word {
  overflow-wrap: anywhere;
}
</style>

<style scoped>
.history-event-card {
  border: 1px solid rgb(var(--v-theme-separator));
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
}
.history-event-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  white-space: normal;
}
.history-event-label {
  flex: 1;
  min-width: 0;
}
.history-event-label h3 {
  font-family: var(--bistro-body);
  font-size: 15px;
  line-height: 1.45;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.history-event-label p {
  font-size: 13px;
  line-height: 1.4;
  margin-top: 4px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
.history-event-body {
  padding: 0 16px 16px;
  font-size: 14px;
  line-height: 1.6;
}
.history-event-body :deep(.v-img) {
  border-radius: 10px;
}
.timeline-recipe-card {
  height: auto !important;
  min-width: 0;
}
.timeline-recipe-card :deep(.bistro-recipe-card),
.timeline-recipe-card :deep(.v-list-item) {
  height: auto !important;
  overflow: hidden;
}
.timeline-recipe-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 8px 8px;
  box-sizing: border-box;
}
.timeline-recipe-rating {
  grid-column: 2;
  justify-self: center;
}
.timeline-recipe-actions {
  grid-column: 3;
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 4px;
}
.timeline-recipe-actions :deep(.v-btn) {
  border-radius: 10px;
  margin: 0 !important;
}
@media (max-width: 600px) {
  .timeline-recipe-toolbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }
}
.timeline-recipe-card :deep(.bistro-recipe-card) {
  border: 1px solid rgb(var(--v-theme-separator)) !important;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface)) !important;
  box-shadow: none !important;
  padding: 12px;
}
.timeline-recipe-actions :deep(.v-btn) {
  width: 44px;
  min-width: 44px;
  height: 44px;
  background: rgba(var(--v-theme-primary), 0.12) !important;
  color: rgb(var(--v-theme-primary)) !important;
  box-shadow: none;
}
.timeline-recipe-actions :deep(.v-icon) {
  color: rgb(var(--v-theme-primary)) !important;
  opacity: 1;
  font-size: 24px;
}
.timeline-recipe-rating :deep(.v-icon) {
  font-size: 24px;
}
</style>
