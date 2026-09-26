<template>
  <BaseDialog :model-value="modelValue"
    :title="state.step === ParseStep.REVIEW ? $t('recipe.parser.review-parsed-ingredients') : $t('recipe.parse-ingredients')"
    :icon="state.step === ParseStep.REVIEW ? null : $globals.icons.fileSign" disable-submit-on-enter
    @update:model-value="emit('update:modelValue', $event)">
    <template #header>
      <div v-if="showReviewProgress && state.step !== ParseStep.REVIEW" class="ingredient-review-progress-header"
        role="status">
        <span class="text-caption">
          {{ $t('recipe.parser.ingredients-review-progress', {
            current: state.reviewedCount,
            total: state.reviewTotal,
          }) }}
        </span>
        <v-progress-linear :model-value="reviewProgress" color="success" height="6" rounded
          :aria-label="$t('recipe.parser.review-parsed-ingredients')" />
      </div>
    </template>
    <v-container fluid class="pa-2 ma-0">
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
          <ParseDialogReview v-model="parsedIngs" />
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
.ingredient-review-progress-header {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0 8px;
}
</style>
