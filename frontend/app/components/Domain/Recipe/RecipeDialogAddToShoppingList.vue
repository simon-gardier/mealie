<template>
  <div v-if="dialog">
    <BaseDialog
      v-if="shoppingListDialog && ready"
      v-model="dialog"
      bottom-sheet
      :title="$t('recipe.add-to-list')"
      :icon="$globals.icons.cartCheck"
    >
      <v-card-text class="shopping-list-picker">
        <p class="shopping-list-picker-help">
          {{ $t('shopping-list.choose-list') }}
        </p>
        <v-switch v-model="onlyMyLists" hide-details color="primary" :label="$t('shopping-list.only-my-lists')" @click="setShowAllToggled()" />
        <BaseEmptyState v-if="!filteredShoppingLists.length" :message="$t('shopping-list.no-shopping-lists-found')" :icon="$globals.icons.cartCheck" />
        <v-list v-else class="shopping-list-picker-options" bg-color="transparent">
          <v-list-item v-for="list in filteredShoppingLists" :key="list.id" class="shopping-list-picker-option" @click="openShoppingListIngredientDialog(list)">
            <template #prepend>
              <UserAvatar :user-id="list.userId" :tooltip="false" size="36" />
            </template>
            <v-list-item-title>{{ list.name }}</v-list-item-title>
            <template #append>
              <v-icon color="text-secondary">
                {{ $globals.icons.chevronRight }}
              </v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
      <template #card-actions>
        <v-btn variant="text" color="primary" @click="dialog = false">
          {{ $t('general.cancel') }}
        </v-btn>
      </template>
    </BaseDialog>
    <BaseDialog
      v-if="shoppingListIngredientDialog"
      v-model="dialog"
      :title="selectedShoppingList?.name || $t('recipe.add-to-list')"
      :icon="$globals.icons.cartCheck"
      width="70%"
      :submit-text="$t('recipe.add-to-list')"
      can-submit
      :submit-disabled="!portionsValid"
      @submit="addRecipesToList()"
    >
      <div style="max-height: 70vh;  overflow-y: auto">
        <v-card
          v-for="(recipeSection, recipeSectionIndex) in recipeIngredientSections"
          :key="recipeSection.recipeId + recipeSectionIndex"
          elevation="0"
          height="fit-content"
          width="100%"
        >
          <v-divider v-if="recipeSectionIndex > 0" class="mt-3" />
          <v-card-title v-if="recipeIngredientSections.length > 1" class="justify-center text-h5" width="100%">
            <v-container style="width: 100%;">
              <v-row no-gutters class="ma-0 pa-0">
                <v-col cols="12" align-self="center" class="text-center">
                  {{ recipeSection.recipeName }}
                  <v-tooltip v-if="recipeSection.parentRecipe?.name" location="top">
                    <template #activator="{ props: tooltipProps }">
                      <v-icon v-bind="tooltipProps" size="tiny" class="mb-2 ml-2" style="cursor: pointer">
                        {{ $globals.icons.potSteam }}
                      </v-icon>
                    </template>
                    <span>{{ $t("shopping-list.ingredient-of-recipe", { recipe: recipeSection.parentRecipe.name })
                    }}</span>
                  </v-tooltip>
                </v-col>
              </v-row>
            </v-container>
          </v-card-title>
          <div class="recipe-portions-control">
            <v-number-input
              :model-value="recipeSection.desiredPortions"
              :label="$t('recipe.servings')"
              :min="0.01"
              :precision="2"
              :step="1"
              :decimal-separator="quantityDecimalSeparator"
              hide-details="auto"
              @beforeinput.capture="onQuantityInput"
              @paste.capture="onQuantityPaste"
              @update:model-value="setPortions(recipeSection, $event)"
            />
          </div>
          <div>
            <div
              v-for="(ingredientSection, ingredientSectionIndex) in recipeSection.ingredientSections"
              :key="recipeSection.recipeId + recipeSectionIndex + ingredientSectionIndex"
            >
              <v-card-title v-if="ingredientSection.sectionName" class="ingredient-title mt-2 pb-0 text-h6">
                {{ ingredientSection.sectionName }}
              </v-card-title>
              <div
                :class="$vuetify.display.smAndDown ? '' : 'ingredient-grid'"
                :style="$vuetify.display.smAndDown ? '' : { gridTemplateRows: `repeat(${Math.ceil(ingredientSection.ingredients.length / 2)}, min-content)` }"
              >
                <v-list-item
                  v-for="(ingredientData, i) in ingredientSection.ingredients"
                  :key="recipeSection.recipeId + recipeSectionIndex + ingredientSectionIndex + i"
                  density="compact"
                  @click="recipeIngredientSections[recipeSectionIndex]
                    .ingredientSections[ingredientSectionIndex]
                    .ingredients[i].checked = !recipeIngredientSections[recipeSectionIndex]
                      .ingredientSections[ingredientSectionIndex]
                      .ingredients[i]
                      .checked"
                >
                  <v-container class="pa-0 ma-0">
                    <div class="shopping-ingredient-row">
                      <v-checkbox
                        hide-details
                        :model-value="ingredientData.checked"
                        class="shopping-ingredient-checkbox"
                        color="secondary"
                        density="compact"
                      />
                      <div :key="`${ingredientData.ingredient?.quantity || 'no-qty'}-${i}`" class="shopping-ingredient-text">
                        <RecipeIngredientListItem
                          :ingredient="ingredientData.ingredient"
                          :scale="recipeSection.recipeScale"
                        />
                      </div>
                    </div>
                  </v-container>
                </v-list-item>
              </div>
            </div>
          </div>
        </v-card>
      </div>
      <div class="d-flex justify-end mb-4 mt-2">
        <BaseButtonGroup
          :buttons="[
            {
              icon: $globals.icons.checkboxMultipleBlankOutline,
              text: $t('shopping-list.uncheck-all-items'),
              event: 'uncheck',
            },
            {
              icon: $globals.icons.checkboxMultipleMarkedOutline,
              text: $t('shopping-list.check-all-items'),
              event: 'check',
            },
          ]"
          @uncheck="bulkCheckIngredients(false)"
          @check="bulkCheckIngredients(true)"
        />
      </div>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { shoppingIngredientWithQuantity } from "~/lib/shopping-ingredient-quantity";
import { setShoppingRecipePortions } from "~/lib/shopping-recipe-portions";
import { toRefs } from "@vueuse/core";
import { useUserApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";
import { useShoppingListPreferences } from "~/composables/use-users/preferences";
import type { RecipeIngredient, ShoppingListAddRecipeParamsBulk, ShoppingListSummary } from "~/lib/api/types/household";
import type { Recipe } from "~/lib/api/types/recipe";
import UserAvatar from "~/components/Domain/User/UserAvatar.vue";
import RecipeIngredientListItem from "./RecipeIngredientListItem.vue";

export interface RecipeWithScale extends Recipe {
  scale: number;
}

export interface ShoppingListIngredient {
  checked: boolean;
  ingredient: RecipeIngredient;
}

export interface ShoppingListIngredientSection {
  sectionName: string;
  ingredients: ShoppingListIngredient[];
}

export interface ShoppingListRecipeIngredientSection {
  recipeId: string;
  recipeName: string;
  recipeScale: number;
  basePortions: number;
  desiredPortions: number | null;
  ingredientSections: ShoppingListIngredientSection[];
  parentRecipe?: Recipe;
}

interface Props {
  recipes?: RecipeWithScale[];
  shoppingLists?: ShoppingListSummary[];
}
const props = withDefaults(defineProps<Props>(), {
  recipes: undefined,
  shoppingLists: () => [],
});

const dialog = defineModel<boolean>({ default: false });

const i18n = useI18n();
const { quantityDecimalSeparator, onQuantityInput, onQuantityPaste } = useQuantityInput();
const auth = useMealieAuth();
const api = useUserApi();
const preferences = useShoppingListPreferences();
const onlyMyLists = computed({
  get: () => !preferences.value.viewAllLists,
  set: value => preferences.value.viewAllLists = !value,
});
const router = useRouter();
const ready = ref(false);

// Capture values at initialization to avoid reactive updates
const currentHouseholdSlug = ref("");
const filteredShoppingLists = ref<ShoppingListSummary[]>([]);

const state = reactive({
  shoppingListDialog: false,
  shoppingListIngredientDialog: false,
  shoppingListShowAllToggled: false,
});

const { shoppingListDialog, shoppingListIngredientDialog, shoppingListShowAllToggled: _shoppingListShowAllToggled } = toRefs(state);

const recipeIngredientSections = ref<ShoppingListRecipeIngredientSection[]>([]);
const selectedShoppingList = ref<ShoppingListSummary | null>(null);

watch([dialog, () => preferences.value.viewAllLists], () => {
  if (dialog.value) {
    currentHouseholdSlug.value = auth.user.value?.householdSlug || "";
    filteredShoppingLists.value = props.shoppingLists.filter(
      list => preferences.value.viewAllLists || list.userId === auth.user.value?.id,
    );

    if (filteredShoppingLists.value.length === 1 && !state.shoppingListShowAllToggled) {
      selectedShoppingList.value = filteredShoppingLists.value[0];
      openShoppingListIngredientDialog(selectedShoppingList.value);
    }
    else {
      state.shoppingListDialog = true;
      ready.value = true;
    }
  }
  else if (!dialog.value) {
    initState();
  }
});

function buildIngredientSections(ingredients: ShoppingListIngredient[]): ShoppingListIngredientSection[] {
  let currentTitle = "";
  const onHandIngs: ShoppingListIngredient[] = [];
  const sections = ingredients.reduce((acc, ing) => {
    if (ing.ingredient.title) {
      currentTitle = ing.ingredient.title;
    }

    if (!acc.length || currentTitle !== acc[acc.length - 1].sectionName) {
      if (acc.length) {
        acc[acc.length - 1].ingredients.push(...onHandIngs);
        onHandIngs.length = 0;
      }
      acc.push({ sectionName: currentTitle, ingredients: [] });
    }

    const householdsWithFood = ing.ingredient?.food?.householdsWithIngredientFood || [];
    if (householdsWithFood.includes(currentHouseholdSlug.value)) {
      onHandIngs.push(ing);
      return acc;
    }

    acc[acc.length - 1].ingredients.push(ing);
    return acc;
  }, [] as ShoppingListIngredientSection[]);

  if (sections.length) {
    sections[sections.length - 1].ingredients.push(...onHandIngs);
  }
  return sections;
}

async function consolidateRecipesIntoSections(recipes: RecipeWithScale[]) {
  const recipeSectionMap = new Map<string, ShoppingListRecipeIngredientSection>();

  function addSubRecipeToMap(ing: RecipeIngredient, parentQuantity: number, parentScale: number, parentRecipe: Recipe) {
    const subRecipe = ing.referencedRecipe!;
    const key = subRecipe.id || subRecipe.slug || "";
    const ownIngs: ShoppingListIngredient[] = [];
    const subRefIngs: RecipeIngredient[] = [];

    for (const subIng of subRecipe.recipeIngredient ?? []) {
      if (subIng.referencedRecipe) {
        subRefIngs.push(subIng);
      }
      else {
        const householdsWithFood = subIng.food?.householdsWithIngredientFood || [];
        ownIngs.push({
          checked: !householdsWithFood.includes(currentHouseholdSlug.value),
          ingredient: shoppingIngredientWithQuantity(subIng),
        });
      }
    }

    recipeSectionMap.set(key, {
      recipeId: subRecipe.id || "",
      recipeName: subRecipe.name || "",
      recipeScale: parentQuantity * parentScale,
      basePortions: subRecipe.recipeServings || 1,
      desiredPortions: (subRecipe.recipeServings || 1) * parentQuantity * parentScale,
      ingredientSections: buildIngredientSections(ownIngs),
      parentRecipe,
    });

    subRefIngs.forEach(subIng => addSubRecipeToMap(subIng, (ing.quantity || 1) * (subIng.quantity || 1), parentScale, subRecipe));
  }

  for (const recipe of recipes) {
    if (!recipe.slug) {
      continue;
    }

    if (recipeSectionMap.has(recipe.slug)) {
      const existingSection = recipeSectionMap.get(recipe.slug);
      if (existingSection) {
        existingSection.recipeScale += recipe.scale;
        existingSection.desiredPortions = existingSection.basePortions * existingSection.recipeScale;
      }
      continue;
    }

    // Create a local copy to avoid mutating props
    let recipeData = { ...recipe };
    if (!(recipeData.id && recipeData.name && recipeData.recipeIngredient)) {
      const { data } = await api.recipes.getOne(recipeData.slug);
      if (!data?.recipeIngredient?.length) {
        continue;
      }
      recipeData = {
        ...recipeData,
        id: data.id || "",
        name: data.name || "",
        recipeIngredient: data.recipeIngredient,
        recipeServings: data.recipeServings,
      };
    }
    else if (!recipeData.recipeIngredient.length) {
      continue;
    }

    const ownIngs: ShoppingListIngredient[] = [];
    const subRefIngs: RecipeIngredient[] = [];
    recipeData.recipeIngredient.forEach((ing) => {
      if (ing.referencedRecipe) {
        subRefIngs.push(ing);
      }
      else {
        const householdsWithFood = ing.food?.householdsWithIngredientFood || [];
        ownIngs.push({
          checked: !householdsWithFood.includes(currentHouseholdSlug.value),
          ingredient: shoppingIngredientWithQuantity(ing),
        });
      }
    });

    recipeSectionMap.set(recipe.slug, {
      recipeId: recipeData.id,
      recipeName: recipeData.name,
      recipeScale: recipeData.scale,
      basePortions: recipeData.recipeServings || 1,
      desiredPortions: (recipeData.recipeServings || 1) * recipeData.scale,
      ingredientSections: buildIngredientSections(ownIngs),
    });

    subRefIngs.forEach(ing => addSubRecipeToMap(ing, ing.quantity || 1, recipeData.scale, recipeData));
  }

  recipeIngredientSections.value = Array.from(recipeSectionMap.values());
}

const portionsValid = computed(() => recipeIngredientSections.value.length > 0
  && recipeIngredientSections.value.every(section => section.desiredPortions != null
    && Number.isFinite(section.desiredPortions) && section.desiredPortions > 0));

function setPortions(section: ShoppingListRecipeIngredientSection, portions: number | null) {
  setShoppingRecipePortions(recipeIngredientSections.value, section, portions);
}

function initState() {
  state.shoppingListDialog = false;
  state.shoppingListIngredientDialog = false;
  state.shoppingListShowAllToggled = false;
  recipeIngredientSections.value = [];
  selectedShoppingList.value = null;
}

initState();

async function openShoppingListIngredientDialog(list: ShoppingListSummary) {
  if (!props.recipes?.length) {
    return;
  }

  selectedShoppingList.value = list;
  await consolidateRecipesIntoSections(props.recipes);
  state.shoppingListDialog = false;
  state.shoppingListIngredientDialog = true;
}

function setShowAllToggled() {
  state.shoppingListShowAllToggled = true;
}

function bulkCheckIngredients(value = true) {
  recipeIngredientSections.value.forEach((recipeSection) => {
    recipeSection.ingredientSections.forEach((ingSection) => {
      ingSection.ingredients.forEach((ing) => {
        ing.checked = value;
      });
    });
  });
}

async function addRecipesToList() {
  if (!selectedShoppingList.value || !portionsValid.value) {
    return;
  }

  const recipeData: ShoppingListAddRecipeParamsBulk[] = [];
  recipeIngredientSections.value.forEach((section) => {
    const ingredients: RecipeIngredient[] = [];
    section.ingredientSections.forEach((ingSection) => {
      ingSection.ingredients.forEach((ing) => {
        if (ing.checked) {
          ingredients.push(ing.ingredient);
        }
      });
    });

    if (!ingredients.length) {
      return;
    }

    recipeData.push(
      {
        recipeId: section.recipeId,
        recipeIncrementQuantity: section.recipeScale,
        recipeIngredients: ingredients,
      },
    );
  });
  const listId = selectedShoppingList.value.id;
  const { error } = await api.shopping.lists.addRecipes(listId, recipeData);
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  error
    ? alert.error(i18n.t("recipe.failed-to-add-recipes-to-list"))
    : alert.success(i18n.t("recipe.successfully-added-to-list"), null, {
        action: {
          message: i18n.t("general.view"),
          onClick: () => router.push(`/shopping-lists/${listId ?? ""}`),
        },
      });

  state.shoppingListDialog = false;
  state.shoppingListIngredientDialog = false;
  dialog.value = false;
}
</script>

<style scoped lang="css">
.shopping-list-picker {
  padding: 24px;
}
.shopping-list-picker-help {
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-bottom: 12px;
  font-size: 14px;
}
.shopping-list-picker-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0 0;
}
.shopping-list-picker-option {
  min-height: 60px;
  border-radius: 12px;
  background: rgba(var(--v-theme-fill), 0.5);
  border: 1px solid rgba(var(--v-theme-separator), 0.5);
}
.shopping-list-picker-option :deep(.v-list-item-title) {
  font: 600 16px var(--bistro-body);
  white-space: normal;
  overflow-wrap: anywhere;
}
@media (max-width: 599px) {
  .shopping-list-picker {
    padding: 16px;
  }
}
.shopping-ingredient-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.shopping-ingredient-checkbox {
  flex: 0 0 auto;
}
.shopping-ingredient-text {
  flex: 1 1 0;
  min-width: 0;
  align-self: center;
  overflow-wrap: anywhere;
}
.recipe-portions-control {
  max-width: 280px;
  padding: 16px;
}
.ingredient-grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: 1fr 1fr;
  grid-gap: 0.5rem;
}
</style>
