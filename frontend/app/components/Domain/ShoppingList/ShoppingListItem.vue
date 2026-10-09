<template>
  <div style="overflow-x: hidden;">
    <v-container
      v-if="!edit"
      class="ml-2 pa-0"
      :style="{
        transform: `translateX(${isRtl ? -swiping : swiping}px)`,
        transition: swiping === 0 ? 'transform 0.2s ease' : 'none',
        opacity: swiping >= SWIPE_THRESHOLD ? 0.5 : 1,
      }"
    >
      <v-row
        ref="swipeRowRef"
        v-touch="{ move: onSwipeMove, start: onSwipeStart, end: onSwipeEnd }"
        style="touch-action: pan-y;"
        no-gutters
        class="flex-nowrap align-center"
      >
        <!-- the text takes every pixel the action buttons don't, so a long name only wraps
             once the row is genuinely full rather than at an arbitrary half-way point -->
        <v-col class="flex-grow-1 flex-shrink-1" style="min-width: 0;">
          <div class="d-flex align-center flex-nowrap">
            <v-checkbox
              :model-value="listItem.checked"
              hide-details
              density="compact"
              class="mt-0 flex-shrink-0"
              color="null"
              @click="toggleChecked"
            />
            <div
              class="ml-2 text-truncate shopping-list-item__text"
              :class="{ 'shopping-item-completed': listItem.checked }"
              style="min-width: 0;"
            >
              <RecipeIngredientListItem :ingredient="listItem" />
              <p v-if="listItem.checked && listItem.updatedAt" class="shopping-item-completed-date">
                {{ $t('shopping-list.completed-on', { date: $d(new Date(listItem.updatedAt)) }) }}
              </p>
            </div>
          </div>
        </v-col>
        <v-col
          cols="auto"
          class="text-right flex-shrink-0"
        >
          <div
            v-if="!listItem.checked"
            style="min-width: 72px"
          >
            <v-menu
              offset-x
              start
              min-width="125px"
            >
              <template #activator="{ props: hoverProps }">
                <v-tooltip
                  v-if="recipeList && recipeList.length"
                  transition="slide-x-reverse-transition"
                  density="compact"
                  location="end"
                  content-class="text-caption"
                >
                  <template #activator="{ props: tooltipProps }">
                    <v-btn
                      size="small"
                      variant="text"
                      class="ml-2"
                      icon
                      v-bind="tooltipProps"
                      :aria-label="$t('shopping-list.linked-recipes-count', recipeList.length)"
                      :aria-expanded="displayRecipeRefs"
                      @click="displayRecipeRefs = !displayRecipeRefs"
                    >
                      <v-icon>
                        {{ $globals.icons.silverwareForkKnife }}
                      </v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t('shopping-list.linked-recipes-count', recipeList.length) }}</span>
                </v-tooltip>

                <v-btn
                  size="small"
                  variant="text"
                  class="handle"
                  :aria-label="$t('general.actions')"
                  icon
                  v-bind="hoverProps"
                >
                  <v-icon>
                    {{ $globals.icons.arrowUpDown }}
                  </v-icon>
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item
                  v-for="action in contextMenu"
                  :key="action.event"
                  density="compact"
                  :base-color="action.event === 'delete' ? 'error' : undefined"
                  :prepend-icon="action.event === 'delete' ? $globals.icons.delete : $globals.icons.edit"
                  @click="$emit(action.event as any)"
                >
                  <v-list-item-title>
                    {{ action.text }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </v-col>
      </v-row>
      <v-container
        v-if="!listItem.checked && recipeList && recipeList.length && displayRecipeRefs"
        class="pa-0"
      >
        <RecipeList
          :recipes="recipeList"
          :list-item="listItem"
          :disabled="isOffline"
          class="shopping-item-recipes"
        />
      </v-container>
    </v-container>
    <div
      v-if="edit"
      class="mb-4"
    >
      <ShoppingListItemEditor
        v-model="localListItem"
        :labels="labels"
        :units="units"
        :foods="foods"
        class="ma-2"
        @save="save"
        @cancel="$emit('view')"
        @delete="$emit('delete')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useOnline } from "@vueuse/core";
import RecipeIngredientListItem from "../Recipe/RecipeIngredientListItem.vue";
import ShoppingListItemEditor from "./ShoppingListItemEditor.vue";
import RecipeList from "~/components/Domain/Recipe/RecipeList.vue";
import type { ShoppingListItemOut } from "~/lib/api/types/household";
import type { MultiPurposeLabelOut } from "~/lib/api/types/labels";
import type { IngredientUnit, IngredientFood, RecipeSummary } from "~/lib/api/types/recipe";

const model = defineModel<ShoppingListItemOut>({ type: Object as () => ShoppingListItemOut, required: true });

const props = defineProps({
  labels: {
    type: Array as () => MultiPurposeLabelOut[],
    required: true,
  },
  units: {
    type: Array as () => IngredientUnit[],
    required: true,
  },
  foods: {
    type: Array as () => IngredientFood[],
    required: true,
  },
  recipes: {
    type: Map as unknown as () => Map<string, RecipeSummary>,
    default: undefined,
  },
  edit: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: "checked" | "save", item: ShoppingListItemOut): void;
  (e: "delete" | "edit" | "view"): void;
}>();

const SWIPE_THRESHOLD = 50;

const { isRtl } = useRtl();
const swipeRowRef = ref<InstanceType<typeof import("vuetify/components").VRow> | null>(null);

onMounted(() => {
  const el = swipeRowRef.value?.$el as HTMLElement | undefined;
  if (!el) return;
  el.addEventListener(
    "touchmove",
    (e: TouchEvent) => {
      if (swipeInfo.value.gesture === "swipe") {
        e.preventDefault();
      }
    },
    { passive: false },
  );
});
const i18n = useI18n();
const displayRecipeRefs = ref(false);
const online = useOnline();
const isOffline = computed(() => online.value === false);

type actions = { text: string; event: string };
const contextMenu = ref<actions[]>([
  { text: i18n.t("general.edit") as string, event: "edit" },
  { text: i18n.t("general.delete") as string, event: "delete" },
]);

// copy prop value so a refresh doesn't interrupt the user
const localListItem = ref(Object.assign({}, model.value));

const listItem = computed<ShoppingListItemOut>({
  get: () => model.value,
  set: (val: ShoppingListItemOut) => {
    localListItem.value = val;
    model.value = val;
  },
});

function toggleChecked() {
  const updated = { ...model.value, checked: !model.value.checked } as ShoppingListItemOut;
  model.value = updated;
  emit("checked", updated);
}

function save() {
  emit("save", localListItem.value);
}

type SwipeGesture = null | "scroll" | "swipe";

const swipeInfo = ref({
  touchstartX: 0,
  touchstartY: 0,
  touchendX: 0,
  touchendY: 0,
  gesture: null as SwipeGesture,
});

function getSwipePoint(e: any) {
  const touch = e?.touches?.[0] ?? e?.changedTouches?.[0] ?? e;
  return { x: touch?.clientX ?? 0, y: touch?.clientY ?? 0 };
}

function resetSwipe() {
  swipeInfo.value = { touchstartX: 0, touchstartY: 0, touchendX: 0, touchendY: 0, gesture: null };
}

function onSwipeStart(payload: any) {
  const { x, y } = getSwipePoint(payload.originalEvent);
  swipeInfo.value = { touchstartX: x, touchstartY: y, touchendX: x, touchendY: y, gesture: null };
}

function onSwipeMove(payload: any) {
  const { x, y } = getSwipePoint(payload.originalEvent);
  swipeInfo.value.touchendX = x;
  swipeInfo.value.touchendY = y;

  if (!swipeInfo.value.gesture) {
    const deltaX = Math.abs(x - swipeInfo.value.touchstartX);
    const deltaY = Math.abs(y - swipeInfo.value.touchstartY);
    if (deltaY > 8 && deltaY > deltaX) {
      swipeInfo.value.gesture = "scroll";
    }
    else if (deltaX > 8 && deltaX > deltaY) {
      swipeInfo.value.gesture = "swipe";
    }
    else if (deltaX > 8 || deltaY > 8) {
      // Diagonal / ambiguous — default to scroll
      swipeInfo.value.gesture = "scroll";
    }
  }
}

function onSwipeEnd() {
  if (swipeInfo.value.gesture === "swipe" && swiping.value >= SWIPE_THRESHOLD) {
    toggleChecked();
  }
  resetSwipe();
}

const swiping = computed(() => {
  if (swipeInfo.value.gesture !== "swipe") {
    return 0;
  }
  const deltaX = isRtl.value
    ? swipeInfo.value.touchstartX - swipeInfo.value.touchendX
    : swipeInfo.value.touchendX - swipeInfo.value.touchstartX;
  return Math.max(0, Math.min(deltaX, 100));
});

const recipeList = computed<RecipeSummary[]>(() => {
  const ret: RecipeSummary[] = [];
  if (!listItem.value.recipeReferences) return ret;
  listItem.value.recipeReferences.forEach((ref) => {
    const recipe = props.recipes?.get(ref.recipeId);
    if (recipe) ret.push(recipe);
  });
  return ret;
});
</script>

<style lang="css">
.strike-through {
  text-decoration: line-through !important;
}

/* The text box must take the whole column, not shrink to its content: the "half the row" rule
   below is measured against this box, and a content-sized box would make "1 pound butter"
   wrap because "1 pound" alone is more than half of it. */
.shopping-list-item__text {
  flex: 1 1 auto;
}

/* The ingredient text is a wrapping flex row (quantity, unit, name, note). Left alone, a long
   name is one unbreakable flex item, so it jumps to a new line and leaves the quantity sitting
   on a line of its own. Let the name shrink and wrap in place instead, unless less than half
   the row is left for it. The note keeps its own full-width line. */
.shopping-list-item__text .ingredient-item > .text-bold {
  flex: 1 1 0;
  min-width: 50%;
}

/* ...and when it does wrap, the quantity and unit stay on its first line instead of floating
   half-way down the block */
.shopping-list-item__text .ingredient-item {
  align-items: baseline;
}
</style>

<style scoped>
.shopping-item-completed :deep(.ingredient-item),
.shopping-item-completed :deep(.text-bold),
.shopping-item-completed :deep(strong) {
  color: rgba(var(--v-theme-text-secondary), var(--v-secondary-label-opacity));
  font-weight: 400;
  text-decoration: line-through;
  text-decoration-color: rgba(var(--v-theme-text-secondary), 0.4);
}
.shopping-item-completed-date {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: rgba(var(--v-theme-text-secondary), var(--v-secondary-label-opacity));
}
.shopping-item-recipes {
  padding: 8px 0 0;
  background: transparent;
}
.shopping-item-recipes :deep(.v-sheet) {
  margin: 0 0 8px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-separator), 0.5);
  background: rgb(var(--v-theme-surface));
  box-shadow: none !important;
  overflow: hidden;
}
.shopping-item-recipes :deep(.v-list-item) {
  min-height: 64px;
  padding: 12px !important;
}
.shopping-item-recipes :deep(.v-list-item-title) {
  white-space: normal !important;
  overflow-wrap: anywhere;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
}
.shopping-item-recipes :deep(.v-list-item-subtitle) {
  white-space: normal;
  margin-top: 4px;
  font-size: 13px;
}
.shopping-item-completed :deep(.ingredient-item) {
  font-size: 15px !important;
  line-height: 1.5;
}
.shopping-item-completed {
  white-space: normal;
}
</style>
