<template>
  <div :class="{ 'ingredient-editor-labeled': showFieldLabels, 'ingredient-editor-compact': compact }">
    <Teleport :to="sectionTitleTarget || 'body'" :disabled="!sectionTitleTarget" defer>
      <h3 v-if="titleVisible && showSectionHeading" class="ingredient-section-heading">
        {{ $t('recipe.ingredient-section-title') }}
      </h3>
      <v-text-field
        v-if="titleVisible"
        v-model="model.title"
        density="comfortable"
        variant="filled"
        hide-details
        class="ingredient-section-title mx-1 mt-3 mb-4"
        :label="$t('recipe.section-title')"
        @click="$emit('clickIngredientField', 'title')"
      >
        <template #append-inner>
          <v-btn
            icon
            variant="text"
            color="error"
            size="small"
            :aria-label="$t('recipe.clear-section')"
            :title="$t('recipe.clear-section')"
            @click.stop="toggleTitle"
          >
            <v-icon :icon="$globals.icons.delete" size="20" />
          </v-btn>
        </template>
      </v-text-field>
    </Teleport>
    <slot name="before-fields" />
    <RecipeIngredientEditorLayout :header="enableDragHandle || (enableContextMenu && !contextMenuBelow)">
      <template v-if="enableDragHandle" #dragHandle>
        <span v-if="compact" class="ingredient-editor-heading">{{ $t('recipe.editor.ingredient-details') }}</span>
        <v-icon class="ma-2 handle" size="large">
          {{ $globals.icons.arrowUpDown }}
        </v-icon>
      </template>
      <template v-if="enableContextMenu && !contextMenuBelow" #contextMenu>
        <BaseButtonGroup
          hover
          :large="false"
          class="ml-auto"
          :buttons="btns"
          @toggle-section="toggleTitle"
          @toggle-subrecipe="toggleIsRecipe"
          @toggle-substitutions="toggleSubstitutions"
          @insert-above="$emit('insert-above')"
          @insert-below="$emit('insert-below')"
          @delete="$emit('delete')"
        />
      </template>
      <template #form>
        <div class="flex-grow-1">
          <div
            class="ga-3 py-2"
            :class="showFieldLabels ? 'ingredient-labeled-grid' : ['d-flex', $vuetify.display.mdAndDown ? 'flex-column align-stretch' : 'align-start']"
          >
            <v-number-input
              v-model="model.quantity"
              variant="filled"
              :precision="null"
              :min="0"
              hide-details
              inset
              density="compact"
              :style="$vuetify.display.mdAndDown ? '' : 'flex: 3 0 50px;'"
              :placeholder="showFieldLabels ? '' : $t('recipe.quantity')"
              :label="showFieldLabels ? $t('recipe.quantity') : undefined"

              :decimal-separator="quantityDecimalSeparator"
              @beforeinput.capture="normalizeQuantityInput($event, quantityDecimalSeparator)"
              @paste.capture="normalizeQuantityPaste($event, quantityDecimalSeparator)"
              @keypress="quantityFilter"
            />
            <div class="ingredient-data-field" :style="$vuetify.display.mdAndDown ? '' : 'flex: 4 0 50px;'">
              <v-autocomplete
                ref="unitAutocomplete"
                v-model="model.unit"
                v-model:search="unitSearch"
                auto-select-first
                hide-details
                density="compact"
                variant="filled"
                return-object
                :items="filteredUnits"
                :custom-filter="() => true"
                item-title="name"
                :placeholder="showFieldLabels ? '' : $t('recipe.choose-unit')"
                :label="showFieldLabels ? $t('recipe.unit') : undefined"

                clearable
                :menu-props="{ attach: props.menuAttachTarget, maxHeight: '250px', contentClass: 'recipe-editor-overlay' }"
                @keyup.enter="handleUnitEnter"
              >
                <template v-if="unitError" #prepend-inner>
                  <v-tooltip location="bottom">
                    <template #activator="{ props: unitTooltipProps }">
                      <v-icon v-bind="unitTooltipProps" class="opacity-100" color="primary">
                        {{ $globals.icons.alert }}
                      </v-icon>
                    </template>
                    <span v-if="unitErrorTooltip">
                      {{ unitErrorTooltip }}
                    </span>
                  </v-tooltip>
                </template>
                <template #no-data>
                  <div class="caption text-center pb-2">
                    {{ $t("recipe.press-enter-to-create") }}
                  </div>
                </template>
                <template #append-item>
                  <div v-if="showCreateUnit" :class="showFieldLabels ? 'ingredient-create-option' : 'px-2'">
                    <v-btn
                      v-if="showFieldLabels"
                      variant="tonal"
                      color="primary"
                      class="editor-secondary-action ingredient-create-button"
                      :prepend-icon="$globals.icons.create"
                      @click="createAssignUnit()"
                    >
                      {{ $t('recipe.parser.add-item', { name: unitSearch }) }}
                    </v-btn>
                    <BaseButton v-else block size="small" @click="createAssignUnit()" />
                  </div>
                </template>
              </v-autocomplete>
              <div v-if="$slots.unitAction" class="attached-field-action">
                <slot name="unitAction" />
              </div>
            </div>

            <!-- Foods Input -->
            <div
              v-if="!state.isRecipe"
              class="ingredient-data-field"
              :style="$vuetify.display.mdAndDown ? '' : 'flex: 7 0 50px;'"
            >
              <v-autocomplete
                ref="foodAutocomplete"
                v-model="model.food"
                v-model:search="foodSearch"
                auto-select-first
                hide-details
                density="compact"
                variant="filled"
                return-object
                :items="filteredFoods"
                :custom-filter="() => true"
                item-title="name"
                :placeholder="showFieldLabels ? '' : $t('recipe.choose-food')"
                :label="showFieldLabels ? $t('shopping-list.food') : undefined"

                clearable
                :menu-props="{ attach: props.menuAttachTarget, maxHeight: '250px', contentClass: 'recipe-editor-overlay' }"
                @keyup.enter="handleFoodEnter"
              >
                <template v-if="foodError" #prepend-inner>
                  <v-tooltip location="bottom">
                    <template #activator="{ props: foodTooltipProps }">
                      <v-icon v-bind="foodTooltipProps" class="opacity-100" color="primary">
                        {{ $globals.icons.alert }}
                      </v-icon>
                    </template>
                    <span v-if="foodErrorTooltip">
                      {{ foodErrorTooltip }}
                    </span>
                  </v-tooltip>
                </template>
                <template #no-data>
                  <div class="caption text-center pb-2">
                    {{ $t("recipe.press-enter-to-create") }}
                  </div>
                </template>
                <template #append-item>
                  <div v-if="showCreateFood" :class="showFieldLabels ? 'ingredient-create-option' : 'px-2'">
                    <v-btn
                      v-if="showFieldLabels"
                      variant="tonal"
                      color="primary"
                      class="editor-secondary-action ingredient-create-button"
                      :prepend-icon="$globals.icons.create"
                      @click="createAssignFood()"
                    >
                      {{ $t('recipe.parser.add-item', { name: foodSearch }) }}
                    </v-btn>
                    <BaseButton v-else block size="small" @click="createAssignFood()" />
                  </div>
                </template>
              </v-autocomplete>
              <div v-if="$slots.foodAction" class="attached-field-action food-action">
                <slot name="foodAction" />
              </div>
            </div>
            <!-- Recipe Input -->
            <v-autocomplete
              v-if="state.isRecipe"
              ref="search.query"
              v-model="model.referencedRecipe"
              v-model:search="search.query.value"
              auto-select-first
              hide-details
              density="compact"
              :style="$vuetify.display.mdAndDown ? '' : 'flex: 7 0 50px;'"
              variant="filled"
              return-object
              :items="search.data.value || []"
              :menu-props="{ contentClass: 'recipe-editor-overlay' }"
              item-title="name"
              :placeholder="$t('search.type-to-search')"
              clearable
              :label="!model.referencedRecipe ? $t('recipe.choose-recipe') : ''"
              @click="search.trigger()"
              @focus="search.trigger()"
            />
            <v-text-field
              v-model="model.note"
              :persistent-placeholder="false"
              hide-details
              density="compact"
              :style="$vuetify.display.mdAndDown ? '' : 'flex: 7 0 50px;'"
              variant="filled"
              :placeholder="showFieldLabels ? '' : $t('recipe.notes')"
              :label="showFieldLabels ? $t('recipe.notes') : undefined"

              class=""
              @click="$emit('clickIngredientField', 'note')"
            />
          </div>
        </div>
      </template>
    </RecipeIngredientEditorLayout>
    <div :class="showFieldLabels ? 'ingredient-editor-support' : ['px-2', { 'ml-10': !$vuetify.display.mdAndDown }]">
      <div
        v-if="!compact && ((showSubstitutionControls && !substitutionsVisible) || $slots['additional-actions'])"
        class="ingredient-editor-actions"
      >
        <v-btn
          v-if="showSubstitutionControls && !substitutionsVisible"
          variant="tonal"
          color="primary"
          class="editor-secondary-action"
          :prepend-icon="$globals.icons.create"
          @click="addSubstitution"
        >
          {{ $t('recipe.parser.add-substitute') }}
        </v-btn>
        <slot name="additional-actions" />
      </div>
      <!-- shown whenever the ingredient carries substitutions, so the toggle can't hide saved data -->
      <div v-if="substitutionsVisible" class="py-2">
        <div class="d-flex align-center text-caption mb-1">
          <v-icon size="small" class="mr-1">
            {{ $globals.icons.swapHorizontal }}
          </v-icon>
          {{ $t("recipe.substitutions") }}
        </div>
        <RecipeIngredientSubstitutionEditor
          :substitutions="model.substitutions || []"
          :foods="allFoods"
          :menu-attach-target="props.menuAttachTarget"
          @add="addSubstitution"
          @delete="deleteSubstitution"
        />
      </div>
      <div v-if="enableContextMenu && contextMenuBelow" class="ingredient-editor-toolbar">
        <slot name="editor-actions" />
        <v-btn
          v-if="compact && showSubstitutionControls && !substitutionsVisible"
          variant="tonal"
          color="primary"
          :prepend-icon="$globals.icons.create"
          @click="addSubstitution"
        >
          {{ $t('recipe.parser.add-substitute') }}
        </v-btn>
        <v-btn
          variant="text"
          color="error"
          class="text-none"
          :icon="compact"
          :aria-label="$t('general.delete')"
          :disabled="deleteDisabled"
          @click="$emit('delete')"
        >
          <v-icon v-if="compact">
            {{ $globals.icons.delete }}
          </v-icon>
          <template v-else>
            {{ $t('general.delete') }}
          </template>
        </v-btn>
        <BaseButtonGroup
          hover
          :large="false"
          class="ml-auto"
          :buttons="btns.filter(button => button.event !== 'delete')"
          @toggle-section="toggleTitle"
          @toggle-subrecipe="toggleIsRecipe"
          @toggle-substitutions="toggleSubstitutions"
          @insert-above="$emit('insert-above')"
          @insert-below="$emit('insert-below')"
          @delete="$emit('delete')"
        />
      </div>
      <slot name="before-divider" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { normalizeQuantityInput, normalizeQuantityPaste } from "~/lib/quantity-input";
import { useNuxtApp } from "#app";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { usePublicExploreApi, useUserApi } from "~/composables/api";
import { useRecipeSearch } from "~/composables/recipes/use-recipe-search";
import { useFoodData, useFoodStore, useUnitData, useUnitStore } from "~/composables/store";
import { useSearch } from "~/composables/use-search";
import { normalize } from "~/composables/use-utils";
import RecipeIngredientSubstitutionEditor from "~/components/Domain/Recipe/RecipeIngredientSubstitutionEditor.vue";
import type { ButtonOption } from "~/components/global/BaseMenu.vue";
import type { RecipeIngredient } from "~/lib/api/types/recipe";

// defineModel replaces modelValue prop
const model = defineModel<RecipeIngredient>({ required: true });

const props = defineProps({
  showFieldLabels: { type: Boolean, default: false },
  showSectionHeading: { type: Boolean, default: false },
  sectionTitleTarget: { type: String, default: undefined },
  showSubstitutionControls: { type: Boolean, default: false },
  menuAttachTarget: {
    type: String,
    default: "body",
  },
  isRecipe: {
    type: Boolean,
    default: false,
  },
  unitError: {
    type: Boolean,
    default: false,
  },
  unitErrorTooltip: {
    type: String,
    default: "",
  },
  foodError: {
    type: Boolean,
    default: false,
  },
  foodErrorTooltip: {
    type: String,
    default: "",
  },
  compact: { type: Boolean, default: false },
  contextMenuBelow: { type: Boolean, default: false },
  enableContextMenu: {
    type: Boolean,
    default: false,
  },
  enableDragHandle: {
    type: Boolean,
    default: false,
  },
  deleteDisabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits([
  "clickIngredientField",
  "insert-above",
  "insert-below",
  "delete",
]);

const i18n = useI18n();
const quantityDecimalSeparator = computed(() => new Intl.NumberFormat(i18n.locale.value)
  .formatToParts(1.1).find(part => part.type === "decimal")?.value ?? ".");
const { $globals } = useNuxtApp();

const state = reactive({
  showTitle: false,
  showSubstitutions: false,
  isRecipe: props.isRecipe,
});

// an ingredient that arrives with a title or substitutions shows them without being toggled on,
// so what the menu entries act on is this, not the flag on its own -- otherwise the first press
// is a no-op and the second one is the destructive half of a toggle nobody saw move
const titleVisible = computed(() => !!model.value.title || state.showTitle);
const substitutionsVisible = computed(() => !!model.value.substitutions?.length || state.showSubstitutions);

const contextMenuOptions = computed(() => {
  // these entries clear what they hide, so they name the action instead of saying "toggle"
  const options = [
    ...(!titleVisible.value
      ? [{
          icon: $globals.icons.textBox,
          text: i18n.t("recipe.editor.ingredient-section-before"),
          event: "toggle-section",
        }]
      : []),
    {
      icon: $globals.icons.silverwareForkKnife,
      text: i18n.t(state.isRecipe ? "recipe.editor.use-food" : "recipe.editor.use-recipe"),
      event: "toggle-subrecipe",
    },
    {
      icon: $globals.icons.swapHorizontal,
      text: substitutionsVisible.value
        ? i18n.t("recipe.clear-substitutions")
        : i18n.t("recipe.add-substitutions"),
      event: "toggle-substitutions",
    },
    {
      icon: $globals.icons.arrowUp,
      text: i18n.t("recipe.editor.insert-ingredient-before"),
      event: "insert-above",
    },
    {
      icon: $globals.icons.arrowDown,
      text: i18n.t("recipe.editor.insert-ingredient-after"),
      event: "insert-below",
    },
  ];

  return options;
});

const btns = computed(() => {
  const out: ButtonOption[] = [
    {
      icon: $globals.icons.dotsVertical,
      text: i18n.t("general.menu"),
      event: "open",
      children: contextMenuOptions.value,
    },
  ];

  // If delete event is being listened for, show delete button
  // $attrs is not available in <script setup>, so always show if parent listens
  out.unshift({
    icon: $globals.icons.delete,
    color: "error",
    text: i18n.t("general.delete"),
    event: "delete",
    children: undefined,
    disabled: props.deleteDisabled,
  });
  return out;
});

// Foods
const foodStore = useFoodStore();
const foodData = useFoodData();
const foodAutocomplete = ref<HTMLInputElement>();
const { search: foodSearch, filtered: filteredFoods } = useSearch(foodStore.store);

const allFoods = computed(() => foodStore.store.value);

const showCreateFood = computed(() =>
  !!foodSearch.value
  && !foodStore.store.value.some(f => normalize(f.name) === normalize(foodSearch.value.trim())),
);

async function createAssignFood() {
  foodData.data.name = foodSearch.value;
  model.value.food = await foodStore.actions.createOne(foodData.data) || undefined;
  foodData.reset();
  foodAutocomplete.value?.blur();
}

// Recipes
const route = useRoute();
const auth = useMealieAuth();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");

const { isOwnGroup } = useLoggedInState();
const api = isOwnGroup.value ? useUserApi() : usePublicExploreApi(groupSlug.value).explore;
const search = useRecipeSearch(api);
const loading = ref(false);
const selectedIndex = ref(-1);
// Reset or Grab Recipes on Change
watch(loading, (val) => {
  if (!val) {
    search.query.value = "";
    selectedIndex.value = -1;
    search.data.value = [];
  }
});

// Units
const unitStore = useUnitStore();
const unitsData = useUnitData();
const unitAutocomplete = ref<HTMLInputElement>();
const { search: unitSearch, filtered: filteredUnits } = useSearch(unitStore.store);

const showCreateUnit = computed(() =>
  !!unitSearch.value
  && !unitStore.store.value.some(u => normalize(u.name) === normalize(unitSearch.value.trim())),
);

async function createAssignUnit() {
  unitsData.data.name = unitSearch.value;
  model.value.unit = await unitStore.actions.createOne(unitsData.data) || undefined;
  unitsData.reset();
  unitAutocomplete.value?.blur();
}

function toggleTitle() {
  if (titleVisible.value) {
    model.value.title = "";
    state.showTitle = false;
  }
  else {
    state.showTitle = true;
  }
}

function addSubstitution() {
  model.value.substitutions = [...(model.value.substitutions || []), { substituteFoodId: null, note: "" }];
  state.showSubstitutions = true;
}

function deleteSubstitution(index: number) {
  model.value.substitutions?.splice(index, 1);
  // Hide the section in every editor when the last substitute is removed.
  state.showSubstitutions = !!model.value.substitutions?.length;
}

function toggleSubstitutions() {
  if (substitutionsVisible.value) {
    model.value.substitutions = [];
    state.showSubstitutions = false;
  }
  else {
    addSubstitution();
  }
}

function toggleIsRecipe() {
  if (state.isRecipe) {
    model.value.referencedRecipe = undefined;
  }
  else {
    model.value.unit = undefined;
    model.value.food = undefined;
  }
  state.isRecipe = !state.isRecipe;
}

function handleUnitEnter() {
  if (
    model.value.unit === undefined
    || model.value.unit === null
    || !normalize(model.value.unit.name).includes(normalize(unitSearch.value))
  ) {
    createAssignUnit();
  }
}

function handleFoodEnter() {
  if (
    model.value.food === undefined
    || model.value.food === null
    || !normalize(model.value.food.name).includes(normalize(foodSearch.value))
  ) {
    createAssignFood();
  }
}

function quantityFilter(e: KeyboardEvent) {
  if (e.key === "-" || e.key === "+" || e.key === "e") {
    e.preventDefault();
  }
}
</script>

<style scoped>
.ingredient-section-heading {
  margin: 16px 4px 8px;
  font-family: var(--bistro-body);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: rgb(var(--v-theme-on-surface));
}

.ingredient-section-heading + .ingredient-section-title {
  margin-top: 0 !important;
}

.ingredient-section-title :deep(.v-field) {
  --v-field-border-color: rgb(var(--v-theme-separator));
  --v-field-border-opacity: 1;
  border-radius: 10px;
  background: rgb(var(--v-theme-fill));
}
.ingredient-section-title :deep(.v-field--focused) {
  --v-field-border-color: rgb(var(--v-theme-primary));
}
.ingredient-section-title :deep(input) {
  font-size: 16px;
  font-weight: 500;
}

.ingredient-editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.ingredient-create-option {
  padding: 8px 12px;
}
.ingredient-create-button {
  max-width: 100%;
  height: auto;
  padding-block: 10px;
}
.ingredient-create-button :deep(.v-btn__content) {
  white-space: normal;
  overflow-wrap: anywhere;
  text-align: left;
}

.ingredient-editor-support {
  padding: 0;
}
.ingredient-editor-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.editor-secondary-action {
  min-height: 44px;
  font-size: 0.875rem;
  text-transform: none;
  letter-spacing: normal;
}

.ingredient-editor-labeled .ingredient-data-field:has(.attached-field-action:not(:empty)) :deep(.v-field) {
  border-bottom-right-radius: 12px;
  border-bottom-left-radius: 12px;
}
.ingredient-editor-labeled .attached-field-action,
.ingredient-editor-labeled .food-action:has(.ingredient-action-button) {
  border: 0;
  margin-top: 0;
  padding: 4px 0 0;
}
.ingredient-editor-labeled .attached-field-action :deep(.v-btn) {
  border-radius: 9px 12px 10px 11px;
  width: auto;
  max-width: 100%;
  justify-content: flex-start;
}

.ingredient-labeled-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
}
@media (max-width: 600px) {
  .ingredient-labeled-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.ingredient-data-field {
  min-width: 0;
}

.ingredient-data-field:has(.attached-field-action:not(:empty)) :deep(.v-field) {
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}

.attached-field-action {
  margin-top: -1px;
  padding: 0.5rem;
}

.food-action {
  border: 0;
}

.food-action:has(.ingredient-action-button) {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.6);
  border-radius: 0 0 10px 11px;
}

.attached-field-action :deep(.v-btn) {
  width: 100%;
  border-radius: 6px;
  box-shadow: none;
}
.ingredient-editor-heading {
  flex: 1;
  font: 600 16px var(--bistro-body);
  color: rgb(var(--v-theme-on-surface));
}
.ingredient-editor-compact .ingredient-labeled-grid {
  gap: 16px 12px !important;
  padding-top: 16px !important;
}
.ingredient-editor-compact .ingredient-editor-toolbar {
  flex-wrap: nowrap;
  justify-content: flex-start;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--v-theme-separator), 0.5);
  gap: 8px;
}
.ingredient-editor-compact .ingredient-editor-toolbar > .v-btn:first-of-type:not(.v-btn--icon) {
  flex: 1 1 auto;
  min-width: 0;
  height: auto;
  min-height: 44px;
  padding: 8px 12px;
  text-transform: none;
}
.ingredient-editor-compact .ingredient-editor-toolbar :deep(.v-btn__content) {
  white-space: normal;
}
.ingredient-editor-compact .ingredient-editor-toolbar > .v-btn--icon {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
}
@media (min-width: 360px) and (max-width: 600px) {
  .ingredient-editor-compact .ingredient-labeled-grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  }
  .ingredient-editor-compact .ingredient-labeled-grid > :nth-child(n + 3) {
    grid-column: 1 / -1;
  }
}
</style>
