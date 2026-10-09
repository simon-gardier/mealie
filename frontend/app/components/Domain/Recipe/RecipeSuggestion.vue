<template>
  <v-container class="recipe-suggestion pa-0">
    <v-row no-gutters>
      <v-col cols="12">
        <v-card class="suggestion-card" variant="flat">
          <NuxtLink :to="recipeRoute" class="suggestion-image" :aria-label="recipe.name">
            <RecipeCardImage
              tiny
              :slug="recipe.slug"
              :recipe-id="recipe.id"
              :image-version="recipe.image"
              :height="160"
              :icon-size="48"
            />
          </NuxtLink>
          <div class="suggestion-content">
            <NuxtLink :to="recipeRoute" class="suggestion-title">{{ recipe.name }}</NuxtLink>
            <div v-if="recipe.description" class="suggestion-description">
              <SafeMarkdown :source="recipe.description" />
            </div>
            <div class="suggestion-actions">
              <RecipeFavoriteBadge v-if="isOwnGroup" :recipe-id="recipe.id" show-always class="suggestion-icon-action suggestion-favorite" />
            </div>
          </div>
        </v-card>
      </v-col>
      <template v-for="(organizer, idx) in missingOrganizers" :key="idx">
        <v-col v-if="organizer.show" cols="12" class="suggestion-missing">
          <p class="suggestion-missing-heading">
            <v-icon :icon="organizer.icon" size="18" />
            {{ $t("recipe-finder.missing") }}
          </p>
          <div class="suggestion-missing-items">
            <div
              v-for="item in organizer.items"
              :key="item.item.id"
              class="suggestion-missing-item"
            >
              <v-checkbox
                :model-value="item.selected"
                color="primary"
                :disabled="disableCheckbox"
                :ripple="false"
                hide-details
                density="compact"
                @update:model-value="handleCheckbox(item)"
              >
                <template #label>
                  {{ organizer.getLabel(item.item) }}
                </template>
              </v-checkbox>
            </div>
          </div>
        </v-col>
      </template>
      <!-- foods the recipe calls for that the user doesn't have, and what covers them. no
           checkbox: the point is that nothing needs adding to the search -->
      <v-col v-if="substitutedFoods?.length" cols="12">
        <div class="d-flex flex-row flex-wrap align-center pt-2">
          <v-icon class="ma-0 pa-0" />
          <v-card-text class="mr-0 my-0 pl-1 py-0 flex-grow-0" style="width: max-content">
            {{ $t("recipe-finder.substituting") }}:
          </v-card-text>
          <v-chip
            v-for="(substituted, idx) in substitutedFoods"
            :key="idx"
            label
            color="primary"
            class="mr-2 my-1"
            variant="tonal"
            :prepend-icon="$globals.icons.swapHorizontal"
          >
            {{ $t("recipe-finder.substitute-for-food", {
              substitute: foodLabel(substituted.substituteFood),
              food: foodLabel(substituted.food),
            }) }}
          </v-chip>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useLoggedInState } from "~/composables/use-logged-in-state";
import type {
  IngredientFood,
  IngredientFoodSummary,
  RecipeSuggestionSubstitutedFood,
  RecipeSummary,
  RecipeTool,
} from "~/lib/api/types/recipe";

interface Organizer {
  type: "food" | "tool";
  item: IngredientFood | RecipeTool;
  selected: boolean;
}

interface Props {
  recipe: RecipeSummary;
  missingFoods?: IngredientFood[] | null;
  missingTools?: RecipeTool[] | null;
  substitutedFoods?: RecipeSuggestionSubstitutedFood[] | null;
  disableCheckbox?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  missingFoods: null,
  missingTools: null,
  substitutedFoods: null,
  disableCheckbox: false,
});
const recipe = computed(() => ({
  ...props.recipe,
  id: props.recipe.id ?? "",
  slug: props.recipe.slug ?? "",
  name: props.recipe.name ?? "",
  rating: props.recipe.rating ?? 0,
}));

const route = useRoute();
const auth = useMealieAuth();
const { isOwnGroup } = useLoggedInState();
const recipeRoute = computed(() => `/g/${route.params.groupSlug || auth.user.value?.groupSlug || ""}/r/${props.recipe.slug}`);

// same label rule the missing-food chips use
function foodLabel(food: IngredientFood | IngredientFoodSummary) {
  return food.pluralName || food.name;
}

const emit = defineEmits<{
  "add-food": [food: IngredientFood];
  "remove-food": [food: IngredientFood];
  "add-tool": [tool: RecipeTool];
  "remove-tool": [tool: RecipeTool];
}>();

const { $globals } = useNuxtApp();
const missingOrganizers = computed(() => [
  {
    type: "food",
    show: props.missingFoods?.length,
    icon: $globals.icons.foods,
    items: props.missingFoods
      ? props.missingFoods.map((food) => {
          return reactive({ type: "food", item: food, selected: false } as Organizer);
        })
      : [],
    getLabel: (item: IngredientFood | RecipeTool) => "pluralName" in item ? item.pluralName || item.name : item.name,
  },
  {
    type: "tool",
    show: props.missingTools?.length,
    icon: $globals.icons.tools,
    items: props.missingTools
      ? props.missingTools.map((tool) => {
          return reactive({ type: "tool", item: tool, selected: false } as Organizer);
        })
      : [],
    getLabel: (item: IngredientFood | RecipeTool) => item.name,
  },
]);

function handleCheckbox(organizer: Organizer) {
  if (props.disableCheckbox) {
    return;
  }

  organizer.selected = !organizer.selected;
  if (organizer.selected) {
    if (organizer.type === "food") {
      emit("add-food", organizer.item as IngredientFood);
    }
    else {
      emit("add-tool", organizer.item as RecipeTool);
    }
  }
  else {
    if (organizer.type === "food") {
      emit("remove-food", organizer.item as IngredientFood);
    }
    else {
      emit("remove-tool", organizer.item as RecipeTool);
    }
  }
}
</script>

<style scoped>
.suggestion-icon-action :deep(.v-btn),
:deep(.v-btn.suggestion-icon-action) {
  width: 44px;
  min-width: 44px;
  height: 44px;
  border-radius: 10px !important;
  background: rgba(var(--v-theme-on-surface), 0.06) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  box-shadow: none !important;
}
.suggestion-icon-action :deep(.v-icon),
:deep(.v-btn.suggestion-icon-action .v-icon) {
  color: rgb(var(--v-theme-on-surface)) !important;
  font-size: 22px !important;
}
.suggestion-icon-action :deep(.v-btn:focus-visible),
:deep(.v-btn.suggestion-icon-action:focus-visible) {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
.suggestion-missing {
  padding: 12px 16px !important;
}
.suggestion-missing-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font: 500 14px/1.4 var(--bistro-body);
  color: rgb(var(--v-theme-text-secondary));
}
.suggestion-missing-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.suggestion-missing-item {
  padding: 0 12px 0 4px;
  min-height: 44px;
  max-width: 100%;
  border: 1px solid rgba(var(--v-theme-separator), 0.5);
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
}
.suggestion-missing-item :deep(.v-label) {
  opacity: 1;
  white-space: normal;
  overflow-wrap: anywhere;
  font-size: 14px;
}
.suggestion-card {
  display: grid;
  grid-template-columns: 144px minmax(0, 1fr);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
}
.suggestion-image {
  align-self: start;
  overflow: hidden;
}
.suggestion-content {
  min-width: 0;
  padding: 16px;
}
.suggestion-title {
  display: block;
  color: rgb(var(--v-theme-on-surface)) !important;
  text-decoration: none;
  overflow-wrap: anywhere;
  font-size: 18px;
  font-family: var(--bistro-heading);
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.4;
  text-align: center;
}
.suggestion-title:hover {
  text-decoration: underline;
}
.suggestion-description {
  margin-top: 8px;
  color: rgb(var(--v-theme-text-secondary));
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}
.suggestion-description :deep(p) {
  margin: 0;
}
.suggestion-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}
@media (max-width: 600px) {
  .suggestion-card {
    grid-template-columns: 88px minmax(0, 1fr);
  }
  .suggestion-content {
    padding: 12px;
  }
  .suggestion-title {
    font-size: 16px;
  }
}
</style>
