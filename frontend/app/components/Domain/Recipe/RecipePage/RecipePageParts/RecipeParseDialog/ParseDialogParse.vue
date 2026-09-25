<template>
  <ParseDialogChangeParser v-model="parser" :available-parsers="availableParsers"
    :show-nlp-language-hint="showNlpLanguageHint" @update:model-value="(newParser) => parser = newParser"
    @parse="parseIngredients" />
  <v-card-text v-if="currentIng" class="pb-0 mb-0 d-flex flex-column ga-2">
    <div class="ingredient-block">
      <div class="ingredient-section-label">{{ $t("recipe.parser.ingredient-text-to-parse") }}:</div>
      <div class="ingredient-preview text-center px-8 py-4 mb-2">
        <p class="ingredient-preview-text">
          “{{ currentIng.input }}”
        </p>
      </div>
    </div>
    <div class="ingredient-block mt-2">
      <div class="ingredient-section-label">{{ $t("recipe.parser.fill-in-the-information") }}:</div>
      <RecipeIngredientEditor v-model="currentIng.ingredient" :unit-error="!!currentMissingUnit"
        :unit-error-tooltip="$t('recipe.parser.this-unit-could-not-be-parsed-automatically')"
        :food-error="!!currentMissingFood"
        :food-error-tooltip="$t('recipe.parser.this-food-could-not-be-parsed-automatically')">
        <template #unitAction>
        <BaseButton v-if="currentMissingUnit && !currentIng.ingredient.unit?.id" :icon="$globals.icons.units"
          block color="warning" :loading="state.loading.unit" @click="createMissingUnit">
          {{ $t("recipe.parser.missing-unit", { unit: currentMissingUnit }) }}
        </BaseButton>
        <BaseButton v-if="
          currentMissingUnit
          && currentIng.ingredient.unit?.id
          && currentMissingUnit.toLowerCase() != currentIng.ingredient.unit?.name.toLowerCase()
        " :icon="$globals.icons.units" block color="warning" :loading="state.loading.unit"
          @click="addMissingUnitAsAlias">
          {{ $t("recipe.parser.add-text-as-alias-for-item", {
            text: currentMissingUnit, item:
              quote(currentIng.ingredient.unit.name) }) }}
        </BaseButton>
        </template>
        <template #foodAction>
        <BaseButton v-if="currentMissingFood && !currentIng.ingredient.food?.id"
          :icon="$globals.icons.information" block color="warning" :loading="state.loading.food"
          @click="createMissingFood">
          {{ $t("recipe.parser.missing-food", { food: quote(currentMissingFood) }) }}
        </BaseButton>
        <BaseButton v-if="
          currentMissingFood
          && currentIng.ingredient.food?.id
          && currentMissingFood.toLowerCase() != currentIng.ingredient.food?.name.toLowerCase()
        " :icon="$globals.icons.information" block color="warning" :loading="state.loading.food"
          @click="addMissingFoodAsAlias">
          {{ $t("recipe.parser.add-text-as-alias-for-item", {
            text: currentMissingFood, item:
              quote(currentIng.ingredient.food.name) }) }}
        </BaseButton>
        </template>
      </RecipeIngredientEditor>
    </div>
  </v-card-text>
</template>

<script setup lang="ts">
import type { useParseIngredientsDialog } from "~/composables/recipes/use-parse-ingredients-dialog";

const props = defineProps<{
  dialogState: ReturnType<typeof useParseIngredientsDialog>;
}>();

function quote(value: string): string {
  return `"${value}"`;
}

const {
  state,
  currentIng,
  showNlpLanguageHint,
  availableParsers,
  parser,
  currentIngHasError,
  currentMissingFood,
  currentMissingUnit,
  parseIngredients,
  createMissingFood,
  createMissingUnit,
  addMissingFoodAsAlias,
  addMissingUnitAsAlias,
} = props.dialogState;
</script>

<style scoped>
.ingredient-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ingredient-section-label {
  font-weight: 600;
  font-size: 0.95rem;
}

.ingredient-preview {
  background: transparent;
}

.ingredient-preview-text {
  font-family: "Borel", cursive;
  font-style: italic;
  font-size: 1.8rem;
  line-height: 1.3;
  margin: 0;
}
</style>
