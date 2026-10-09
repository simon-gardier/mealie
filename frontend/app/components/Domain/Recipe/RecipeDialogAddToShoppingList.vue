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
      width="100%"
      max-width="680px"
      :submit-text="$t('recipe.add-to-list')"
      can-submit
      :submit-disabled="!portionsValid || !ingredientsAnalyzed || addingToList"
      @submit="addRecipesToList()"
    >
      <v-sheet v-if="!ingredientsAnalyzed" color="fill" class="ma-4 pa-4 text-body-2" rounded="lg" role="status">
        <v-icon class="mr-2" color="text-secondary">
          {{ $globals.icons.information }}
        </v-icon>
        {{ $t('shopping-list.analyze-before-adding') }}
      </v-sheet>
      <div class="shopping-ingredients-body">
        <section
          v-for="(recipeSection, recipeSectionIndex) in recipeIngredientSections"
          :key="recipeSection.recipeId + recipeSectionIndex"
          class="shopping-recipe-section"
        >
          <v-divider v-if="recipeSectionIndex > 0" class="mt-3" />
          <div v-if="recipeIngredientSections.length > 1" class="shopping-recipe-heading">
            <h2 class="shopping-recipe-title">
              {{ recipeSection.recipeName }}
            </h2>
            <v-tooltip v-if="recipeSection.parentRecipe?.name" location="top">
              <template #activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  :icon="$globals.icons.potSteam"
                  variant="text"
                  color="text-secondary"
                  :aria-label="$t('shopping-list.ingredient-of-recipe', { recipe: recipeSection.parentRecipe.name })"
                />
              </template>
              <span>{{ $t('shopping-list.ingredient-of-recipe', { recipe: recipeSection.parentRecipe.name }) }}</span>
            </v-tooltip>
          </div>
          <div class="recipe-portions-control">
            <RecipeScaleEditButton
              :model-value="recipeSection.recipeScale"
              :recipe-servings="recipeSection.basePortions"
              :edit-scale="recipeSection.canScale"
              :analysis-required="!recipeSection.canScale"
              :unanalyzed-subrecipes="recipeSection.unanalyzedSubrecipes"
              :min-portions="0.01"
              @update:model-value="setPortions(recipeSection, $event * recipeSection.basePortions)"
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
              <div class="shopping-ingredient-options">
                <v-list-item
                  v-for="(ingredientData, i) in ingredientSection.ingredients"
                  :key="recipeSection.recipeId + recipeSectionIndex + ingredientSectionIndex + i"
                  density="compact"
                  @click="ingredientData.checked = !ingredientData.checked"
                >
                  <v-container class="pa-0 ma-0">
                    <div class="shopping-ingredient-row">
                      <v-checkbox
                        hide-details
                        :model-value="ingredientData.checked"
                        class="shopping-ingredient-checkbox"
                        color="primary"
                        density="compact"
                        :aria-label="ingredientData.ingredient.food?.name || ingredientData.ingredient.note || $t('recipe.ingredients')"
                        @click.stop
                        @update:model-value="ingredientData.checked = !!$event"
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
        </section>
      </div>
      <div class="shopping-selection-actions">
        <v-btn variant="text" color="primary" height="44" :prepend-icon="$globals.icons.checkboxMultipleMarkedOutline" @click="bulkCheckIngredients(true)">
          {{ $t('shopping-list.select-all-ingredients') }}
        </v-btn>
        <v-btn variant="text" color="primary" height="44" :prepend-icon="$globals.icons.checkboxMultipleBlankOutline" @click="bulkCheckIngredients(false)">
          {{ $t('shopping-list.deselect-all-ingredients') }}
        </v-btn>
      </div>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { shoppingIngredientWithQuantity } from "~/lib/shopping-ingredient-quantity";
import { canScaleShoppingRecipe, setShoppingRecipePortions, unanalyzedSubrecipeNames } from "~/lib/shopping-recipe-portions";
import { toRefs } from "@vueuse/core";
import { useUserApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";
import { useShoppingListPreferences } from "~/composables/use-users/preferences";
import type { RecipeIngredient, ShoppingListAddRecipeParamsBulk, ShoppingListSummary } from "~/lib/api/types/household";
import type { Recipe } from "~/lib/api/types/recipe";
import UserAvatar from "~/components/Domain/User/UserAvatar.vue";
import RecipeIngredientListItem from "./RecipeIngredientListItem.vue";
import RecipeScaleEditButton from "./RecipeScaleEditButton.vue";

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
  canScale: boolean;
  unanalyzedSubrecipes?: string[];
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
const auth = useMealieAuth();
const api = useUserApi();
const preferences = useShoppingListPreferences();
const onlyMyLists = computed({
  get: () => !preferences.value.viewAllLists,
  set: value => preferences.value.viewAllLists = !value,
});
const router = useRouter();
const ready = ref(false);
const addingToList = ref(false);

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
const ingredientsAnalyzed = ref(false);

watch([dialog, () => preferences.value.viewAllLists], () => {
  if (dialog.value) {
    currentHouseholdSlug.value = auth.user.value?.householdSlug || "";
    filteredShoppingLists.value = props.shoppingLists.filter(
      list => preferences.value.viewAllLists || list.userId === auth.user.value?.id,
    );

    if (filteredShoppingLists.value.length === 1 && !state.shoppingListShowAllToggled) {
      const list = filteredShoppingLists.value[0];
      if (list) {
        selectedShoppingList.value = list;
        openShoppingListIngredientDialog(list);
      }
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

    let section = acc.at(-1);
    if (!section || currentTitle !== section.sectionName) {
      if (section) {
        section.ingredients.push(...onHandIngs);
        onHandIngs.length = 0;
      }
      section = { sectionName: currentTitle, ingredients: [] };
      acc.push(section);
    }

    const householdsWithFood = ing.ingredient?.food?.householdsWithIngredientFood || [];
    if (householdsWithFood.includes(currentHouseholdSlug.value)) {
      onHandIngs.push(ing);
      return acc;
    }

    section.ingredients.push(ing);
    return acc;
  }, [] as ShoppingListIngredientSection[]);

  sections.at(-1)?.ingredients.push(...onHandIngs);
  return sections;
}

async function consolidateRecipesIntoSections(recipes: RecipeWithScale[]) {
  ingredientsAnalyzed.value = recipes.length > 0;
  const recipeSectionMap = new Map<string, ShoppingListRecipeIngredientSection>();

  function addSubRecipeToMap(ing: RecipeIngredient, parentQuantity: number, parentScale: number, parentRecipe: Recipe) {
    const subRecipe = ing.referencedRecipe!;
    const canScale = canScaleShoppingRecipe(subRecipe.recipeIngredient);
    const scale = canScale ? parentQuantity * parentScale : 1;
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
      unanalyzedSubrecipes: unanalyzedSubrecipeNames(subRecipe.recipeIngredient),
      recipeId: subRecipe.id || "",
      recipeName: subRecipe.name || "",
      recipeScale: scale,
      canScale,
      basePortions: subRecipe.recipeServings || 1,
      desiredPortions: (subRecipe.recipeServings || 1) * scale,
      ingredientSections: buildIngredientSections(ownIngs),
      parentRecipe,
    });

    subRefIngs.forEach(subIng => addSubRecipeToMap(subIng, (ing.quantity || 1) * (subIng.quantity || 1), parentScale, subRecipe));
  }

  for (const recipe of recipes) {
    if (!recipe.slug) {
      ingredientsAnalyzed.value = false;
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
      const { data } = await api.recipes.getOne(recipe.slug);
      if (!data?.recipeIngredient?.length) {
        ingredientsAnalyzed.value = false;
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
      ingredientsAnalyzed.value = false;
      continue;
    }

    const canScale = canScaleShoppingRecipe(recipeData.recipeIngredient);
    if (!canScale) ingredientsAnalyzed.value = false;
    if (!canScale) recipeData.scale = 1;

    const ownIngs: ShoppingListIngredient[] = [];
    const subRefIngs: RecipeIngredient[] = [];
    (recipeData.recipeIngredient ?? []).forEach((ing) => {
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
      unanalyzedSubrecipes: unanalyzedSubrecipeNames(recipeData.recipeIngredient),
      recipeId: recipeData.id ?? "",
      recipeName: recipeData.name ?? "",
      recipeScale: recipeData.scale,
      canScale,
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
  ingredientsAnalyzed.value = false;
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
  if (addingToList.value || !selectedShoppingList.value || !portionsValid.value || !ingredientsAnalyzed.value) {
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
  if (!recipeData.length) return;
  addingToList.value = true;
  try {
    const { error } = await api.shopping.lists.addRecipes(listId, recipeData);
    if (error) {
      alert.error(i18n.t("recipe.failed-to-add-recipes-to-list"));
      return;
    }
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
  catch {
    alert.error(i18n.t("recipe.failed-to-add-recipes-to-list"));
  }
  finally { addingToList.value = false; }
}
</script>

<style scoped lang="css">
.shopping-recipe-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 16px 0;
  min-width: 0;
}
.shopping-recipe-title {
  flex: 1;
  min-width: 0;
  margin: 0;
  font: 600 18px/1.4 var(--bistro-body);
  color: rgb(var(--v-theme-on-surface));
  white-space: normal;
  overflow-wrap: anywhere;
}
.shopping-recipe-heading > .v-btn {
  flex: 0 0 auto;
}
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
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 336px;
  padding: 0 0 16px;
}
.shopping-ingredients-body {
  padding: 24px 24px 8px;
  max-height: 60dvh;
  overflow-y: auto;
}
.shopping-recipe-heading {
  padding: 0 0 12px;
}
.shopping-ingredient-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.shopping-ingredient-options > .v-list-item {
  min-height: 48px;
  padding-inline: 8px;
  border-radius: 8px;
  background: rgba(var(--v-theme-fill), 0.35);
}
.shopping-selection-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 24px 16px;
}
.shopping-selection-actions .v-btn {
  border-radius: 10px;
}
@media (max-width: 599px) {
  .shopping-ingredients-body {
    padding: 16px 16px 8px;
  }
  .shopping-selection-actions {
    padding: 8px 16px 16px;
  }
}
</style>
