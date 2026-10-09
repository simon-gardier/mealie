import { ingredientAnalysisErrorKey } from "~/lib/ingredient-analysis-error";
import { alert } from "~/composables/use-toast";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import type { IngredientFood, IngredientUnit, ParsedIngredient, RecipeIngredient } from "~/lib/api/types/recipe";
import type { Parser } from "~/lib/api/user/recipes/recipe";
import { useUserApi } from "../api";
import { useFoodData, useFoodStore, useUnitData, useUnitStore } from "../store";
import { useParsingPreferences } from "../use-users/preferences";
import { useIngredientTextParser } from "./use-recipe-ingredients";

export const enum ParseStep {
  LOADING,
  INFO,
  PARSE,
  REVIEW,
}

export function useParseIngredientsDialog(
  ingredients: NoUndefinedField<RecipeIngredient[]>,
  onSave: (ingredients: NoUndefinedField<RecipeIngredient>[]) => void,
) {
  const { ingredientToParserString } = useIngredientTextParser();

  const { group } = useGroupSelf();
  const i18n = useI18n();
  const api = useUserApi();

  const unitStore = useUnitStore();
  const unitData = useUnitData();
  const foodStore = useFoodStore();
  const foodData = useFoodData();

  // The natural language parser is trained on English recipes, so it isn't a sensible default for
  // other languages: it recognises the quantity but leaves the unit in the food name.
  const isEnglishLocale = computed(() => (i18n.locale.value || "").toLowerCase().startsWith("en"));
  const parserPreferences = useParsingPreferences(isEnglishLocale.value ? "nlp" : "brute");
  const parser = ref<Parser>(parserPreferences.value.parser || "nlp");
  const showNlpLanguageHint = computed(() => parser.value === "nlp" && !isEnglishLocale.value);
  const dontShowInfoPage = ref(parserPreferences.value.dontShowInfoPage);
  const availableParsers = computed(() => {
    return [
      {
        text: i18n.t("recipe.parser.natural-language-processor"),
        value: "nlp",
      },
      {
        text: i18n.t("recipe.parser.brute-parser"),
        value: "brute",
      },
      {
        text: i18n.t("recipe.parser.openai-parser"),
        value: "openai",
        hide: !group.value?.aiProviderSettings?.aiEnabled,
      },
    ];
  });

  /**
 * If confidence of parsing is below this threshold,
 * we will prompt the user to review the parsed ingredient.
 */
  const confidenceThreshold = 0.85;
  const parsedIngs = ref<ParsedIngredient[]>([]);

  const currentIng = ref<ParsedIngredient | null>(null);
  const currentMissingUnit = ref("");
  const currentMissingFood = ref("");
  const currentIngHasError = computed(() => currentMissingUnit.value || currentMissingFood.value);
  const currentIngShouldDelete = ref(false);

  const state = reactive({
    currentParsedIndex: -1,
    allReviewed: false,
    reviewedCount: 0,
    reviewTotal: 0,
    saveLoading: false,
    step: ParseStep.LOADING,
    loadingCount: 0,
    // Tracked separately from loadingCount, which covers the bulk parse: one ingredient can be
    // missing both a unit and a food, and only the button that was pressed should react.
    loading: {
      unit: false,
      food: false,
    },
  });
  function nextStep() {
    state.step = getNextStep(state.step);
  }

  function getNextStep(current: ParseStep) {
    switch (current) {
      case ParseStep.LOADING:
        if (!dontShowInfoPage.value) {
          console.log("showing info");
          // return ParseStep.INFO;
          return getNextStep(ParseStep.INFO);
        };
        return getNextStep(ParseStep.INFO);
      case ParseStep.INFO:
        if (!state.allReviewed) {
          return ParseStep.PARSE;
        }
        return ParseStep.REVIEW;
      case ParseStep.PARSE:
      case ParseStep.REVIEW:
        return ParseStep.REVIEW;
    }
  }

  function shouldReview(ing: ParsedIngredient): boolean {
    if ([...additionalIngredients.values()].some(ingredients => ingredients.includes(ing))) return false;
    console.debug(`Checking if ingredient needs review (input="${ing.input})":`, ing);

    if (ing.ingredient.referencedRecipe) {
      console.debug("No review needed for sub-recipe ingredient");
      return false;
    }

    if ((ing.confidence?.average || 0) < confidenceThreshold) {
      console.debug("Needs review due to low confidence:", ing.confidence?.average);
      return true;
    }

    const food = ing.ingredient.food;
    if (food && !food.id) {
      console.debug("Needs review due to missing food ID:", food);
      return true;
    }

    const unit = ing.ingredient.unit;
    if (unit && !unit.id) {
      console.debug("Needs review due to missing unit ID:", unit);
      return true;
    }

    console.debug("No review needed");
    return false;
  }

  function checkUnit(ing: ParsedIngredient) {
    const unit = ing.ingredient.unit?.name;
    if (!unit || ing.ingredient.unit?.id) {
      currentMissingUnit.value = "";
      return;
    }

    const potentialMatch = createdUnits.get(unit.toLowerCase());
    if (potentialMatch) {
      ing.ingredient.unit = potentialMatch;
      currentMissingUnit.value = "";
      return;
    }

    currentMissingUnit.value = unit;
    ing.ingredient.unit = undefined;
  }

  function checkFood(ing: ParsedIngredient) {
    const food = ing.ingredient.food?.name;
    if (!food || ing.ingredient.food?.id) {
      currentMissingFood.value = "";
      return;
    }

    const normalizedFood = food.toLowerCase();
    const potentialMatch = createdFoods.get(normalizedFood)
      || foodStore.store.value.find(existingFood => existingFood.name.toLowerCase() === normalizedFood
        || existingFood.aliases?.some(alias => alias.name.toLowerCase() === normalizedFood));
    if (potentialMatch) {
      ing.ingredient.food = potentialMatch;
      currentMissingFood.value = "";
      return;
    }

    currentMissingFood.value = food;
    ing.ingredient.food = undefined;
  }

  const ingredientsToReview = computed(() => parsedIngs.value.filter(shouldReview));

  // Additional ingredients share a source line but are edited inline rather than counted as
  // another automatic analysis to review.
  const additionalIngredients = reactive(new Map<ParsedIngredient, ParsedIngredient[]>());
  const currentAdditionalIngredients = computed(() => currentIng.value
    ? (additionalIngredients.get(currentIng.value) || []).filter(ing => parsedIngs.value.includes(ing))
    : []);

  function addAdditionalIngredient() {
    if (!currentIng.value || state.loading.unit || state.loading.food) return;
    const extra: ParsedIngredient = {
      input: currentIng.value.input,
      confidence: { average: 1 },
      ingredient: { quantity: 0, referenceId: uuid4(), substitutions: [] },
    };
    const siblings = currentAdditionalIngredients.value;
    const last = siblings.at(-1) || currentIng.value;
    const index = parsedIngs.value.indexOf(last);
    parsedIngs.value.splice(index + 1, 0, extra);
    additionalIngredients.set(currentIng.value, [...siblings, parsedIngs.value[index + 1]!]);
  }

  function removeAdditionalIngredient(ingredient: ParsedIngredient) {
    if (state.loading.unit || state.loading.food) return;
    const index = parsedIngs.value.indexOf(ingredient);
    if (index >= 0 && currentAdditionalIngredients.value.includes(ingredient)) parsedIngs.value.splice(index, 1);
  }

  const reviewHistory = ref<ParsedIngredient[]>([]);
  const missingDetails = new Map<ParsedIngredient, { unit: string; food: string }>();
  const availableReviewHistory = computed(() => reviewHistory.value.filter(ing => parsedIngs.value.includes(ing)));
  const canGoToPreviousIngredient = computed(() => state.allReviewed
    ? availableReviewHistory.value.length > 0
    : availableReviewHistory.value.indexOf(currentIng.value!) > 0);
  const emptyReviewPlaceholder = ref<ParsedIngredient | null>(null);
  const removedIngredient = ref<{
    ingredient: ParsedIngredient;
    index: number;
    historyIndex: number;
    reviewedCount: number;
    reviewTotal: number;
    unit: string;
    food: string;
  } | null>(null);
  const canUndoRemoveIngredient = computed(() => !!removedIngredient.value);

  function removeCurrentIngredient() {
    if (!currentIng.value || state.loading.unit || state.loading.food) return;
    removedIngredient.value = {
      ingredient: currentIng.value,
      index: state.currentParsedIndex,
      historyIndex: reviewHistory.value.indexOf(currentIng.value),
      reviewedCount: state.reviewedCount,
      reviewTotal: state.reviewTotal,
      unit: currentMissingUnit.value,
      food: currentMissingFood.value,
    };
    currentIngShouldDelete.value = true;
    nextIngredient();
  }

  function undoRemoveIngredient() {
    const removed = removedIngredient.value;
    if (!removed || state.loading.unit || state.loading.food || state.saveLoading) return;
    rememberMissingDetails();
    if (emptyReviewPlaceholder.value) {
      const placeholder = emptyReviewPlaceholder.value;
      // Keep a placeholder if it has since become an ingredient the user authored.
      if (!placeholder.ingredient.quantity && !placeholder.ingredient.food && !placeholder.ingredient.unit
        && !placeholder.ingredient.note && !placeholder.ingredient.title && !placeholder.ingredient.referencedRecipe) {
        parsedIngs.value = parsedIngs.value.filter(ing => ing !== placeholder);
      }
      emptyReviewPlaceholder.value = null;
    }
    parsedIngs.value.splice(removed.index, 0, removed.ingredient);
    reviewHistory.value.splice(removed.historyIndex, 0, removed.ingredient);
    missingDetails.set(removed.ingredient, { unit: removed.unit, food: removed.food });
    selectIngredient(removed.ingredient);
    state.reviewedCount = removed.reviewedCount;
    state.reviewTotal = removed.reviewTotal;
    state.allReviewed = false;
    state.step = ParseStep.PARSE;
    removedIngredient.value = null;
  }

  function rememberMissingDetails() {
    if (currentIng.value) {
      missingDetails.set(currentIng.value, { unit: currentMissingUnit.value, food: currentMissingFood.value });
    }
  }

  function selectIngredient(ing: ParsedIngredient) {
    state.currentParsedIndex = parsedIngs.value.indexOf(ing);
    currentIng.value = ing;
    currentIngShouldDelete.value = false;
    const details = missingDetails.get(ing);
    if (details) {
      currentMissingUnit.value = details.unit;
      currentMissingFood.value = details.food;
    }
    else {
      reviewHistory.value.push(ing);
      checkUnit(ing);
      checkFood(ing);
    }
  }

  function previousIngredient() {
    if (!canGoToPreviousIngredient.value || state.loading.unit || state.loading.food) {
      return;
    }
    rememberMissingDetails();
    const previousIndex = state.allReviewed
      ? availableReviewHistory.value.length - 1
      : availableReviewHistory.value.indexOf(currentIng.value!) - 1;
    selectIngredient(availableReviewHistory.value[previousIndex]!);
    state.reviewedCount = previousIndex;
    state.allReviewed = false;
    state.step = ParseStep.PARSE;
  }

  function nextIngredient() {
    if (state.loading.unit || state.loading.food) {
      return;
    }
    rememberMissingDetails();
    let nextIndex = state.currentParsedIndex;
    if (currentIngShouldDelete.value) {
      if (currentIng.value) {
        reviewHistory.value = reviewHistory.value.filter(ing => ing !== currentIng.value);
        missingDetails.delete(currentIng.value);
      }
      parsedIngs.value.splice(state.currentParsedIndex, 1);
      state.reviewTotal = Math.max(0, state.reviewTotal - 1);
      currentIngShouldDelete.value = false;
    }
    else {
      if (currentIng.value) {
        state.reviewedCount = Math.min(state.reviewedCount + 1, state.reviewTotal);
      }
      nextIndex += 1;
    }

    while (nextIndex < parsedIngs.value.length) {
      const current = parsedIngs.value[nextIndex]!;
      if (reviewHistory.value.includes(current) || shouldReview(current)) {
        selectIngredient(current);
        return;
      }

      nextIndex += 1;
    }

    // No more to review
    state.allReviewed = true;
    nextStep();
  }

  /** Clear everything left over from a previous run, so re-opening the dialog starts clean */
  function resetParserState() {
    parsedIngs.value = [];
    additionalIngredients.clear();
    reviewHistory.value = [];
    removedIngredient.value = null;
    emptyReviewPlaceholder.value = null;
    missingDetails.clear();
    currentIng.value = null;
    currentMissingUnit.value = "";
    currentMissingFood.value = "";
    currentIngShouldDelete.value = false;
    state.currentParsedIndex = -1;
    state.allReviewed = false;
    state.reviewedCount = 0;
    state.reviewTotal = 0;
    state.step = ParseStep.LOADING;
    state.saveLoading = false;
    createdUnits.clear();
    createdFoods.clear();
  }

  async function parseIngredients() {
    if (state.loadingCount > 0) {
      return;
    }

    resetParserState();

    if (!ingredients || ingredients.length === 0) {
      nextStep();
      return;
    }
    try {
      const filteredIngredients = ingredients.filter(ing => !ing.referencedRecipe);
      const ingsAsString = filteredIngredients.map(ing => ingredientToParserString(ing));
      state.loadingCount += 1;
      const { data, error } = await api.recipes.parseIngredients(parser.value, ingsAsString);
      if (error || !data) {
        throw error || new Error("Failed to parse ingredients");
      }

      // Restore section titles from original ingredients — the parser doesn't return them
      data.forEach((parsed, index) => {
        parsed.ingredient.title = filteredIngredients[index]?.title || "";
      });

      const recipeRefs = ingredients.filter(ing => ing.referencedRecipe).map(ing => ({
        input: ing.note || "",
        confidence: {},
        ingredient: ing,
      }));
      parsedIngs.value = [...data, ...recipeRefs];
      state.currentParsedIndex = -1;
      state.allReviewed = false;
      state.reviewedCount = 0;
      state.reviewTotal = ingredientsToReview.value.length;
      createdUnits.clear();
      createdFoods.clear();
      currentIngShouldDelete.value = false;
      await foodStore.actions.refresh();
      nextIngredient();
    }
    catch (error) {
      console.error("Error parsing ingredients:", error);
      alert.error(i18n.t(ingredientAnalysisErrorKey(parser.value, error)));
    }
    finally {
      state.loadingCount -= 1;
      nextStep();
    }
  }

  /** Cache of lowercased created units to avoid duplicate creations */
  const createdUnits = new Map<string, IngredientUnit>();
  /** Cache of lowercased created foods to avoid duplicate creations */
  const createdFoods = new Map<string, IngredientFood>();

  async function createMissingUnit() {
    if (!currentMissingUnit.value) {
      return;
    }

    unitData.reset();
    unitData.data.name = currentMissingUnit.value;

    state.loading.unit = true;
    try {
      let newUnit: IngredientUnit | null;
      if (createdUnits.has(unitData.data.name)) {
        newUnit = createdUnits.get(unitData.data.name)!;
      }
      else {
        newUnit = await unitStore.actions.createOne(unitData.data);
      }

      if (!newUnit) {
        alert.error(i18n.t("general.cant-create-permission"));
        return;
      }

      currentIng.value!.ingredient.unit = newUnit;
      createdUnits.set(newUnit.name.toLowerCase(), newUnit);
      currentMissingUnit.value = "";
    }
    finally {
      state.loading.unit = false;
    }
  }

  async function createMissingFood() {
    if (!currentMissingFood.value) {
      return;
    }

    foodData.reset();
    foodData.data.name = currentMissingFood.value;

    state.loading.food = true;
    try {
      let newFood: IngredientFood | null;
      if (createdFoods.has(foodData.data.name)) {
        newFood = createdFoods.get(foodData.data.name)!;
      }
      else {
        newFood = await foodStore.actions.createOne(foodData.data);
      }

      if (!newFood) {
        alert.error(i18n.t("general.cant-create-permission"));
        return;
      }

      currentIng.value!.ingredient.food = newFood;
      createdFoods.set(newFood.name.toLowerCase(), newFood);
      currentMissingFood.value = "";
    }
    finally {
      state.loading.food = false;
    }
  }

  async function addMissingUnitAsAlias() {
    const unit = currentIng.value?.ingredient.unit as IngredientUnit | undefined;
    if (!currentMissingUnit.value || !unit?.id) {
      return;
    }

    unit.aliases = unit.aliases || [];
    if (unit.aliases.map(a => a.name).includes(currentMissingUnit.value)) {
      return;
    }

    unit.aliases.push({ name: currentMissingUnit.value });

    state.loading.unit = true;
    try {
      const updated = await unitStore.actions.updateOne(unit);
      if (!updated) {
        alert.error(i18n.t("events.something-went-wrong"));
        return;
      }

      currentIng.value!.ingredient.unit = updated;
      currentMissingUnit.value = "";
    }
    finally {
      state.loading.unit = false;
    }
  }

  async function addMissingFoodAsAlias() {
    const food = currentIng.value?.ingredient.food as IngredientFood | undefined;
    if (!currentMissingFood.value || !food?.id) {
      return;
    }

    food.aliases = food.aliases || [];
    if (food.aliases.map(a => a.name).includes(currentMissingFood.value)) {
      return;
    }

    food.aliases.push({ name: currentMissingFood.value });

    state.loading.food = true;
    try {
      const updated = await foodStore.actions.updateOne(food);
      if (!updated) {
        alert.error(i18n.t("events.something-went-wrong"));
        return;
      }

      currentIng.value!.ingredient.food = updated;
      currentMissingFood.value = "";
    }
    finally {
      state.loading.food = false;
    }
  }

  watch(parser, () => {
    parserPreferences.value.parser = parser.value;
  });

  watch(dontShowInfoPage, () => {
    parserPreferences.value.dontShowInfoPage = dontShowInfoPage.value;
  });

  watch([parsedIngs, () => state.allReviewed], () => {
    if (!state.allReviewed) {
      return;
    }

    if (!parsedIngs.value.length) {
      insertNewIngredient(0);
      emptyReviewPlaceholder.value = parsedIngs.value[0]!;
    }
  }, { immediate: true, deep: true });

  function insertNewIngredient(index: number) {
    const ing = {
      input: "",
      confidence: {},
      ingredient: {
        quantity: 0,
        referenceId: uuid4(),
      },
    } as ParsedIngredient;

    parsedIngs.value.splice(index, 0, ing);
  }

  function saveIngs() {
    onSave(parsedIngs.value.map(x => x.ingredient as NoUndefinedField<RecipeIngredient>));
    state.saveLoading = true;
  }

  const ingredientsToReviewCount = computed(() => ingredientsToReview.value.length);
  const autoParsedIngredientsCount = computed(() => parsedIngs.value.length - ingredientsToReviewCount.value);

  return {
    currentIngHasError,
    availableParsers,
    parserPreferences,
    parser,
    showNlpLanguageHint,
    dontShowInfoPage,
    confidenceThreshold,
    parsedIngs,
    currentIng,
    currentMissingUnit,
    currentMissingFood,
    currentIngShouldDelete,
    state,
    ingredientsToReviewCount,
    autoParsedIngredientsCount,
    nextStep,
    saveIngs,
    nextIngredient,
    previousIngredient,
    canGoToPreviousIngredient,
    removeCurrentIngredient,
    undoRemoveIngredient,
    canUndoRemoveIngredient,
    parseIngredients,
    insertNewIngredient,
    currentAdditionalIngredients,
    addAdditionalIngredient,
    removeAdditionalIngredient,
    addMissingFoodAsAlias,
    addMissingUnitAsAlias,
    createMissingFood,
    createMissingUnit,
  };
}
