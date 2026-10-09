<template>
  <div v-if="currentIng" class="ingredient-analysis-form">
    <div class="ingredient-block">
      <h3 class="ingredient-section-label">
        {{ $t("recipe.parser.source-text") }}
      </h3>
      <div class="ingredient-preview">
        <p class="ingredient-preview-text">
          “{{ currentIng.input }}”
        </p>
      </div>
    </div>
    <div class="ingredient-block mt-3">
      <h3 class="ingredient-section-label">
        {{ $t("recipe.parser.recognized-ingredient") }}
      </h3>
      <p class="analysis-help">
        {{ $t("recipe.parser.review-help-short") }}
      </p>
      <RecipeIngredientEditor
        v-model="currentIng.ingredient"
        show-field-labels
        show-section-heading
        show-substitution-controls
        :unit-error="!!currentMissingUnit"
        :unit-error-tooltip="$t('recipe.parser.this-unit-could-not-be-parsed-automatically')"
        :food-error="!!currentMissingFood"
        :food-error-tooltip="$t('recipe.parser.this-food-could-not-be-parsed-automatically')"
      >
        <template #unitAction>
          <BaseActionPanel
            v-if="currentMissingUnit && !currentIng.ingredient.unit?.id"
            :description="$t('recipe.parser.unrecognized-unit', { name: currentMissingUnit })"
          >
            <v-btn
              color="primary"
              variant="tonal"
              class="ingredient-action-button"
              :prepend-icon="$globals.icons.create"
              :loading="state.loading.unit"
              @click="createMissingUnit"
            >
              {{ $t('recipe.parser.create-unit') }}
            </v-btn>
          </BaseActionPanel>
          <BaseActionPanel
            v-else-if="currentMissingUnit && currentIng.ingredient.unit?.id
              && currentMissingUnit.toLowerCase() !== currentIng.ingredient.unit.name.toLowerCase()"
            :description="$t('recipe.parser.alias-description', { name: currentMissingUnit, item: currentIng.ingredient.unit.name })"
          >
            <v-btn
              color="primary"
              variant="tonal"
              class="ingredient-action-button"
              :prepend-icon="$globals.icons.create"
              :loading="state.loading.unit"
              @click="addMissingUnitAsAlias"
            >
              {{ $t('recipe.parser.add-alias') }}
            </v-btn>
          </BaseActionPanel>
        </template>
        <template #foodAction>
          <BaseActionPanel
            v-if="currentMissingFood && !currentIng.ingredient.food?.id"
            :description="$t('recipe.parser.unrecognized-food', { name: currentMissingFood })"
          >
            <v-btn
              color="primary"
              variant="tonal"
              class="ingredient-action-button"
              :prepend-icon="$globals.icons.create"
              :loading="state.loading.food"
              @click="createMissingFood"
            >
              {{ $t('recipe.parser.create-food') }}
            </v-btn>
          </BaseActionPanel>
          <BaseActionPanel
            v-else-if="currentMissingFood && currentIng.ingredient.food?.id
              && currentMissingFood.toLowerCase() !== currentIng.ingredient.food.name.toLowerCase()"
            :description="$t('recipe.parser.alias-description', { name: currentMissingFood, item: currentIng.ingredient.food.name })"
          >
            <v-btn
              color="primary"
              variant="tonal"
              class="ingredient-action-button"
              :prepend-icon="$globals.icons.create"
              :loading="state.loading.food"
              @click="addMissingFoodAsAlias"
            >
              {{ $t('recipe.parser.add-alias') }}
            </v-btn>
          </BaseActionPanel>
        </template>
        <template v-if="!currentAdditionalIngredients.length" #additional-actions>
          <v-btn
            variant="tonal"
            color="primary"
            class="editor-secondary-action"
            :prepend-icon="$globals.icons.create"
            :disabled="state.loading.unit || state.loading.food"
            @click="addAdditionalIngredient"
          >
            {{ $t('recipe.parser.add-another-ingredient') }}
          </v-btn>
        </template>
      </RecipeIngredientEditor>
    </div>

    <div
      v-for="(ingredient, index) in currentAdditionalIngredients"
      :key="ingredient.ingredient.referenceId"
      class="additional-ingredient"
    >
      <div class="d-flex align-center justify-space-between ga-2 mb-2">
        <span class="ingredient-section-label">{{ $t('recipe.parser.additional-ingredient', { number: index + 2 }) }}</span>
        <v-btn
          variant="text"
          color="error"
          :disabled="state.loading.unit || state.loading.food"
          @click="removeAdditionalIngredient(ingredient)"
        >
          {{ $t('general.delete') }}
        </v-btn>
      </div>
      <RecipeIngredientEditor v-model="ingredient.ingredient" show-field-labels show-section-heading show-substitution-controls />
    </div>

    <div v-if="currentAdditionalIngredients.length" class="mt-3">
      <v-btn
        variant="tonal"
        color="primary"
        class="editor-secondary-action"
        :prepend-icon="$globals.icons.create"
        :disabled="state.loading.unit || state.loading.food"
        @click="addAdditionalIngredient"
      >
        {{ $t('recipe.parser.add-another-ingredient') }}
      </v-btn>
    </div>
    <ParseDialogChangeParser
      v-model="parser"
      :available-parsers="availableParsers"
      :show-nlp-language-hint="showNlpLanguageHint"
      :disabled="state.loading.unit || state.loading.food"
      @parse="parseIngredients"
    />
  </div>
</template>

<script setup lang="ts">
import type { useParseIngredientsDialog } from "~/composables/recipes/use-parse-ingredients-dialog";

const props = defineProps<{
  dialogState: ReturnType<typeof useParseIngredientsDialog>;
}>();

const {
  state,
  currentIng,
  showNlpLanguageHint,
  availableParsers,
  parser,
  currentAdditionalIngredients,
  addAdditionalIngredient,
  removeAdditionalIngredient,
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
.additional-ingredient {
  margin-top: 20px;
  padding: 16px;
  border-radius: 12px;
  background: rgb(var(--v-theme-fill));
}
.ingredient-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ingredient-section-label {
  font-size: 1.125rem;
  line-height: 1.4;
  font-weight: 700;
  color: rgb(var(--v-theme-text-primary));
}
.ingredient-preview {
  background: rgb(var(--v-theme-fill));
  border-radius: 14px;
  padding: 16px;
}
.ingredient-preview-text {
  font-size: 1.25rem;
  line-height: 1.5;
  font-weight: 500;
  margin: 0;
  overflow-wrap: anywhere;
}
.analysis-help {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: rgba(var(--v-theme-text-secondary), var(--v-secondary-label-opacity));
}

.editor-secondary-action {
  min-height: 44px;
  font-size: 0.875rem;
  text-transform: none;
  letter-spacing: normal;
}
.ingredient-action-button {
  padding-inline: 12px;
  text-transform: none;
  letter-spacing: normal;
  height: auto !important;
  min-height: 44px;
}
:deep(.ingredient-action-button .v-btn__content) {
  white-space: normal;
  overflow-wrap: anywhere;
  text-align: left;
}
:deep(.attached-field-action) {
  border: 0;
  padding: 4px 0 0;
}
</style>
