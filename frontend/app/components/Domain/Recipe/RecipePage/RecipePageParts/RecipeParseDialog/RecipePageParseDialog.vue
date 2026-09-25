<template>
  <BaseDialog :model-value="modelValue" :title="$t('recipe.parse-ingredients')" :icon="$globals.icons.fileSign"
    disable-submit-on-enter @update:model-value="emit('update:modelValue', $event)">
    <v-container fluid class="pa-2 ma-0">
      <div v-if="showReviewProgress" class="ingredient-review-progress mb-4" role="status">
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-caption text-medium-emphasis">
            {{ $t('recipe.parser.ingredients-review-progress', {
              current: state.reviewedCount,
              total: state.reviewTotal,
            }) }}
          </span>
        </div>
        <v-progress-linear :model-value="reviewProgress" color="success" height="6" rounded
          :aria-label="$t('recipe.parser.review-parsed-ingredients')" />
      </div>
      <SwipeTransition direction="left">
        <!-- These wrapping divs appear to be load-bearing in making sure the transition renders correctly -->
        <div v-if="state.step === ParseStep.LOADING">
          <AppLoader class="my-6" :waiting-text="$t('recipe.parser.parsing-ingredients')" />
        </div>
        <div v-else-if="state.step === ParseStep.INFO">
          <ParseDialogInfo v-model="dontShowInfoPage" :auto-parsed="autoParsedIngredientsCount"
            :to-review="ingredientsToReviewCount" />
        </div>
        <div v-else-if="state.step === ParseStep.PARSE && currentIng" :key="currentIng.ingredient.referenceId">
          <ParseDialogParse :dialog-state="dialogState" />
        </div>
        <div v-else>
          <ParseDialogReview v-model="parsedIngs" :available-parsers="availableParsers" :parser="parser"
            :show-nlp-language-hint="showNlpLanguageHint" @parse="parseIngredients"
            @change-parser="(newParser) => parser = newParser" />
        </div>
      </SwipeTransition>
    </v-container>
    <template #card-actions />
    <template v-if="state.step !== ParseStep.LOADING" #custom-card-action>
      <SwipeTransition direction="left">
        <BaseButton v-if="state.step === ParseStep.INFO" color="info" icon-right :icon="$globals.icons.arrowRightBold"
          :text="$t('general.next')" @click="nextStep" />
        <div v-else-if="state.step === ParseStep.PARSE" class="d-flex align-center ga-2">
          <BaseButton color="grey-darken-2" icon-only minor :icon="$globals.icons.delete" :title="$t('general.delete')"
            @click="deleteCurrentIngredient" />
          <BaseButton color="info" icon-right :icon="$globals.icons.arrowRightBold" :text="$t('general.next')"
            @click="nextIngredient" />
        </div>
        <BaseButton v-else-if="state.step === ParseStep.REVIEW" :icon="$globals.icons.save" :loading="state.saveLoading"
          @click="saveIngs" />
      </SwipeTransition>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ParseStep, useParseIngredientsDialog } from "~/composables/recipes/use-parse-ingredients-dialog";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import type { RecipeIngredient } from "~/lib/api/types/recipe";

const props = defineProps<{
  modelValue: boolean;
  ingredients: NoUndefinedField<RecipeIngredient[]>;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "save", value: NoUndefinedField<RecipeIngredient[]>): void;
}>();

const dialogState = useParseIngredientsDialog(props.ingredients, ings => emit("save", ings));

const {
  availableParsers,
  parser,
  showNlpLanguageHint,
  dontShowInfoPage,
  parsedIngs,
  currentIng,
  currentIngShouldDelete,
  state,
  autoParsedIngredientsCount,
  ingredientsToReviewCount,
  nextStep,
  saveIngs,
  nextIngredient,
  parseIngredients,
} = dialogState;
const showReviewProgress = computed(() => state.reviewTotal > 0
  && (state.step === ParseStep.PARSE || state.step === ParseStep.REVIEW));
const reviewProgress = computed(() => state.reviewedCount / state.reviewTotal * 100);

function deleteCurrentIngredient() {
  currentIngShouldDelete.value = true;
  nextIngredient();
}

watch(() => props.modelValue, () => {
  if (!props.modelValue) {
    return;
  }

  parseIngredients();
});
</script>

<style scoped>
.ingredient-review-progress {
  padding: 0 12px 8px;
}
</style>
