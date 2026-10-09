<template>
  <div class="recipe-history">
    <v-row class="ma-0 mb-4">
      <v-spacer />
      <v-col class="text-right">
        <div class="d-flex justify-end align-center flex-wrap ga-2">
          <v-btn
            variant="tonal"
            :prepend-icon="preferences.orderDirection === 'asc' ? $globals.icons.sortCalendarDescending : $globals.icons.sortCalendarAscending"
            :title="preferences.orderDirection === 'asc' ? $t('general.sort-descending') : $t('general.sort-ascending')"
            height="44"
            @click="reverseSort"
          >
            {{ $t(preferences.orderDirection === 'asc' ? 'recipe.history-oldest-first' : 'recipe.history-newest-first') }}
          </v-btn>
          <!-- Filters -->
          <v-menu
            location="bottom end"
            content-class="recipe-editor-overlay"
            max-width="320"
            :close-on-content-click="false"
          >
            <template #activator="{ props: activatorProps }">
              <v-badge
                :content="filterBadgeCount"
                :model-value="filterBadgeCount > 0"
                bordered
              >
                <v-btn
                  variant="tonal"
                  v-bind="activatorProps"
                  :prepend-icon="$globals.icons.filter"
                  height="44"
                >
                  {{ $t('general.filter') }}
                </v-btn>
              </v-badge>
            </template>
            <v-card>
              <v-list>
                <v-list-item
                  v-for="option, idx in eventTypeFilterState"
                  :key="idx"
                  :active="option.checked"
                  :color="option.checked ? 'primary' : undefined"
                  @click="toggleEventTypeOption(option.value)"
                >
                  <template #prepend>
                    <v-icon>
                      {{ option.icon }}
                    </v-icon>
                  </template>
                  <v-list-item-title>
                    {{ option.label }}
                  </v-list-item-title>
                  <template #append>
                    <v-checkbox-btn
                      :model-value="option.checked"
                      color="primary"
                      @click.stop
                      @update:model-value="toggleEventTypeOption(option.value)"
                    />
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>
        </div>
      </v-col>
    </v-row>
    <div
      v-if="timelineEvents.length"
      id="timeline-container"
      height="fit-content"
      width="100%"
      class="px-1"
      :style="maxHeight ? `max-height: ${maxHeight}; overflow-y: auto;` : ''"
    >
      <v-timeline
        density="compact"
        side="end"
        align="start"
        truncate-line="both"
        class="timeline"
      >
        <RecipeTimelineItem
          v-for="(event, index) in timelineEvents"
          :key="event.id"
          :event="event"
          :recipe="recipes.get(event.recipeId)"
          :show-recipe-cards="showRecipeCards"
          :width="$vuetify.display.smAndDown ? '100%' : undefined"
          @update="updateTimelineEvent(index, $event)"
          @delete="deleteTimelineEvent(index)"
        />
      </v-timeline>
    </div>
    <BaseEmptyState v-else-if="!loading" :message="$t('recipe.timeline-no-events-found-try-adjusting-filters')" :icon="$globals.icons.timelineText" />
    <RecipeLoading v-if="loading" :label="$t('general.loading-events')" />
  </div>
</template>

<script setup lang="ts">
import { useThrottleFn, whenever } from "@vueuse/core";
import RecipeTimelineItem from "./RecipeTimelineItem.vue";
import { useTimelinePreferences } from "~/composables/use-users/preferences";
import { useTimelineEventTypes } from "~/composables/recipes/use-recipe-timeline-events";
import { alert } from "~/composables/use-toast";
import { useUserApi } from "~/composables/api";
import type { Recipe, RecipeTimelineEventOut, RecipeTimelineEventUpdate, TimelineEventType } from "~/lib/api/types/recipe";

interface Props {
  modelValue?: boolean;
  queryFilter: string;
  maxHeight?: number | string;
  showRecipeCards?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  maxHeight: undefined,
  showRecipeCards: false,
});

const api = useUserApi();
const i18n = useI18n();
const preferences = useTimelinePreferences();
const { eventTypeOptions } = useTimelineEventTypes();
const loading = ref(true);
const ready = ref(false);

const page = ref(1);
const perPage = 32;
const hasMore = ref(true);

const timelineEvents = ref([] as RecipeTimelineEventOut[]);
const recipes = new Map<string, Recipe>();
const filterBadgeCount = computed(() => eventTypeOptions.value.filter(option => preferences.value.types.includes(option.value)).length);
const eventTypeFilterState = computed(() => {
  return eventTypeOptions.value.map((option) => {
    return {
      ...option,
      checked: preferences.value.types.includes(option.value),
    };
  });
});
const screenBuffer = 4;

whenever(
  () => props.modelValue,
  () => {
    initializeTimelineEvents();
  },
);

// Preferences
function reverseSort() {
  if (loading.value) {
    return;
  }

  preferences.value.orderDirection = preferences.value.orderDirection === "asc" ? "desc" : "asc";
  initializeTimelineEvents();
}

function toggleEventTypeOption(option: TimelineEventType) {
  if (loading.value) {
    return;
  }

  const index = preferences.value.types.indexOf(option);
  if (index === -1) {
    preferences.value.types.push(option);
  }
  else {
    preferences.value.types.splice(index, 1);
  }

  initializeTimelineEvents();
}

// Timeline Actions
async function updateTimelineEvent(index: number, event: RecipeTimelineEventUpdate) {
  const eventId = timelineEvents.value[index].id;
  const { response } = await api.recipes.updateTimelineEvent(eventId, event);
  if (response?.status !== 200) {
    alert.error(i18n.t("events.something-went-wrong") as string);
    return;
  }

  // Update the local event data to reflect the changes in the UI
  timelineEvents.value[index] = response.data;

  alert.success(i18n.t("events.event-updated") as string);
}

async function deleteTimelineEvent(index: number) {
  const { response } = await api.recipes.deleteTimelineEvent(timelineEvents.value[index].id);
  if (response?.status !== 200) {
    alert.error(i18n.t("events.something-went-wrong") as string);
    return;
  }

  timelineEvents.value.splice(index, 1);
  alert.success(i18n.t("events.event-deleted") as string);
}

async function getRecipes(recipeIds: string[]): Promise<Recipe[]> {
  let qf = "";
  if (recipeIds.length) {
    qf = "id IN [" + recipeIds.map(id => `"${id}"`).join(", ") + "]";
  }
  const { data } = await api.recipes.getAll(1, -1, { queryFilter: qf });
  return data?.items || [];
}

async function updateRecipes(events: RecipeTimelineEventOut[]) {
  const recipeIds: string[] = [];
  events.forEach((event) => {
    if (recipeIds.includes(event.recipeId) || recipes.has(event.recipeId)) {
      return;
    }

    recipeIds.push(event.recipeId);
  });

  const results = await getRecipes(recipeIds);
  results.forEach((result) => {
    if (!result?.id) {
      return;
    }
    recipes.set(result.id, result);
  });
}

async function scrollTimelineEvents() {
  const orderBy = "timestamp";
  const orderDirection = preferences.value.orderDirection === "asc" ? "asc" : "desc";

  const eventTypeValue = `["${preferences.value.types.join("\", \"")}"]`;
  const queryFilter = `(${props.queryFilter}) AND eventType IN ${eventTypeValue}`;

  const response = await api.recipes.getAllTimelineEvents(page.value, perPage, { orderBy, orderDirection, queryFilter });
  page.value += 1;
  if (!response?.data) {
    return;
  }

  const events = response.data.items;
  if (events.length < perPage) {
    hasMore.value = false;
    if (!events.length) {
      return;
    }
  }

  // fetch recipes
  if (props.showRecipeCards) {
    await updateRecipes(events);
  }

  // this is set last so Vue knows to re-render
  timelineEvents.value.push(...events);
}

async function initializeTimelineEvents() {
  loading.value = true;
  ready.value = false;

  page.value = 1;
  hasMore.value = true;
  timelineEvents.value = [];
  await scrollTimelineEvents();

  ready.value = true;
  loading.value = false;
}

const infiniteScroll = useThrottleFn(async () => {
  if (!hasMore.value || loading.value) {
    return;
  }
  loading.value = true;
  try {
    await scrollTimelineEvents();
  }
  finally {
    loading.value = false;
  }
}, 500);

// preload events
initializeTimelineEvents();

onMounted(
  () => {
    document.onscroll = () => {
      // if the inner element is scrollable, let its scroll event handle the infiniteScroll
      const timelineContainerElement = document.getElementById("timeline-container");
      if (timelineContainerElement) {
        const { clientHeight, scrollHeight } = timelineContainerElement;

        // if scrollHeight == clientHeight, the element is not scrollable, so we need to look at the global position
        // if scrollHeight > clientHeight, it is scrollable and we don't need to do anything here
        if (scrollHeight > clientHeight) {
          return;
        }
      }

      const bottomOfWindow = document.documentElement.scrollTop + window.innerHeight >= document.documentElement.offsetHeight - (window.innerHeight * screenBuffer);
      if (bottomOfWindow) {
        infiniteScroll();
      }
    };
  },
);
</script>

<style scoped>
.recipe-history {
  padding: 24px;
}
.recipe-history :deep(.v-timeline-item__body) {
  width: 100%;
  min-width: 0;
  padding-block: 0 16px;
}
.recipe-history :deep(.v-timeline-divider__dot) {
  box-shadow: none;
}
@media (max-width: 600px) {
  .recipe-history {
    padding: 16px;
  }
}
</style>
