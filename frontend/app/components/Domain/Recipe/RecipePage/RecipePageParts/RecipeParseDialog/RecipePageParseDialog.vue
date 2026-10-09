<template>
  <BaseDialog
    :model-value="modelValue"
    width="760"
    max-width="760"
    color="surface"
    :title="$t('recipe.parse-ingredients')"
    cancel-in-toolbar
    disable-submit-on-enter
    content-class="ingredient-analysis-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="analysis-header">
        <div class="analysis-header-row">
          <h2 class="analysis-title">
            {{ state.step === ParseStep.REVIEW ? $t('recipe.parser.final-review') : $t('recipe.parse-ingredients') }}
          </h2>
          <v-menu v-if="state.step === ParseStep.PARSE && currentIng" location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn v-bind="menuProps" class="analysis-count" variant="tonal" color="primary" :aria-label="currentIngredientLabel">
                {{ currentPosition }} / {{ state.reviewTotal }}
              </v-btn>
            </template>
            <v-card class="pa-3" role="status">
              {{ currentIngredientLabel }}
            </v-card>
          </v-menu>
        </div>
      </div>
    </template>
    <div class="analysis-body">
      <div v-if="state.step === ParseStep.LOADING" class="analysis-loading" role="status">
        <AppLoader tiny :waiting-text="''" :aria-label="$t('general.loading')" />
        <p class="text-body-1 font-weight-medium">
          {{ $t('recipe.parser.parsing-ingredients') }}
        </p>
        <p class="analysis-secondary">
          {{ $t('recipe.parser.loading-description') }}
        </p>
      </div>
      <ParseDialogInfo
        v-else-if="state.step === ParseStep.INFO"
        v-model="dontShowInfoPage"
        :auto-parsed="autoParsedIngredientsCount"
        :to-review="ingredientsToReviewCount"
      />
      <template v-else-if="state.step === ParseStep.PARSE && currentIng">
        <ParseDialogParse :dialog-state="dialogState" />
      </template>
      <template v-else-if="state.step === ParseStep.REVIEW">
        <p class="analysis-secondary final-review-description">
          {{ $t('recipe.parser.final-review-description') }}
        </p>
        <ParseDialogReview v-model="parsedIngs" />
      </template>
    </div>
    <template #card-actions>
      <div class="analysis-footer">
        <div v-if="canUndoRemoveIngredient" class="analysis-undo" role="status">
          <span>{{ $t('recipe.parser.ingredient-removed') }}</span>
          <v-btn variant="text" color="primary" :disabled="busy" @click="undoRemoveIngredient">
            {{ $t('recipe.parser.undo') }}
          </v-btn>
        </div>
        <div class="analysis-navigation">
          <v-btn
            v-if="state.step === ParseStep.LOADING"
            variant="text"
            color="primary"
            @click="emit('update:modelValue', false)"
          >
            {{ $t('general.cancel') }}
          </v-btn>
          <v-btn
            v-else
            variant="text"
            color="primary"
            :disabled="!canGoToPreviousIngredient || busy"
            class="navigation-button"
            :prepend-icon="$globals.icons.back"
            @click="previousIngredient"
          >
            {{ $t('general.previous') }}
          </v-btn>
          <v-btn
            v-if="state.step === ParseStep.PARSE && currentIng"
            class="analysis-remove"
            variant="text"
            color="error"
            :icon="$vuetify.display.xs"
            :disabled="busy"
            :aria-label="$t('recipe.parser.remove-ingredient')"
            @click="removeCurrentIngredient"
          >
            <v-icon :start="!$vuetify.display.xs">
              {{ $globals.icons.delete }}
            </v-icon>
            <span v-if="!$vuetify.display.xs">{{ $t('recipe.parser.remove-ingredient') }}</span>
          </v-btn>
          <v-btn
            v-if="state.step === ParseStep.PARSE"
            variant="tonal"
            color="primary"
            :disabled="busy"
            class="navigation-button"
            :append-icon="$globals.icons.forward"
            @click="nextIngredient"
          >
            {{ lastIngredient ? $t('recipe.parser.review-all') : $t('general.next') }}
          </v-btn>
          <v-btn
            v-else-if="state.step === ParseStep.REVIEW"
            variant="flat"
            color="primary"
            :loading="state.saveLoading"
            @click="saveIngs"
          >
            {{ $t('recipe.parser.apply-to-recipe') }}
          </v-btn>
          <v-btn v-else-if="state.step === ParseStep.INFO" variant="flat" color="primary" @click="nextStep">
            {{ $t('general.next') }}
          </v-btn>
        </div>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ParseStep, useParseIngredientsDialog } from "~/composables/recipes/use-parse-ingredients-dialog";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import type { RecipeIngredient } from "~/lib/api/types/recipe";
import type { Parser } from "~/lib/api/user/recipes/recipe";

const props = defineProps<{
  modelValue: boolean;
  ingredients: RecipeIngredient[];
  initialParser?: Parser | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "save", value: NoUndefinedField<RecipeIngredient[]>): void;
}>();

const dialogState = useParseIngredientsDialog(props.ingredients, ings => emit("save", ings));

const {
  parser,
  defaultParser,
  dontShowInfoPage,
  parsedIngs,
  currentIng,
  removeCurrentIngredient,
  undoRemoveIngredient,
  canUndoRemoveIngredient,
  state,
  autoParsedIngredientsCount,
  ingredientsToReviewCount,
  nextStep,
  saveIngs,
  nextIngredient,
  previousIngredient,
  canGoToPreviousIngredient,
  parseIngredients,
} = dialogState;
const i18n = useI18n();
const busy = computed(() => state.loading.unit || state.loading.food || state.saveLoading);
const currentPosition = computed(() => Math.min(state.reviewedCount + 1, state.reviewTotal));
const currentIngredientLabel = computed(() => i18n.t("recipe.parser.current-ingredient", { current: currentPosition.value, total: state.reviewTotal }));

const lastIngredient = computed(() => state.reviewedCount + 1 >= state.reviewTotal);

watch(() => props.modelValue, () => {
  if (!props.modelValue) {
    return;
  }

  parser.value = props.initialParser ?? defaultParser.value;
  parseIngredients();
});
</script>

<style scoped>
.analysis-header {
  flex: 1;
  min-width: 0;
}
.analysis-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.analysis-count {
  flex-shrink: 0;
  min-height: 44px;
  border-radius: 10px;
}
.analysis-title {
  flex: 1;
  min-width: 0;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.35;
}
.analysis-body {
  padding: 24px;
}
.analysis-secondary {
  color: rgba(var(--v-theme-text-secondary), var(--v-secondary-label-opacity));
  line-height: 1.5;
}
.final-review-description {
  margin-bottom: 24px;
}
.analysis-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 36px 12px;
  text-align: center;
}
.analysis-footer {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 8px 12px;
}
.analysis-navigation {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
}
.analysis-navigation .v-btn {
  min-height: 44px;
  border-radius: 12px;
  text-transform: none;
  letter-spacing: normal;
}
.analysis-undo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.875rem;
}
@media (max-width: 600px) {
  .analysis-body {
    padding: 20px 16px;
  }
  .analysis-navigation .v-btn {
    min-width: 0;
    white-space: normal;
    flex: 1;
  }
}
.analysis-navigation > .v-btn:first-child {
  justify-self: start;
}
.analysis-navigation > .v-btn:last-child {
  grid-column: 3;
  justify-self: end;
}
.analysis-navigation > .analysis-remove {
  grid-column: 2;
  justify-self: center;
}
@media (max-width: 600px) {
  .analysis-navigation {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
  }
  .analysis-navigation > .v-btn:first-child {
    grid-column: 1;
    grid-row: 1;
  }
  .analysis-navigation > .analysis-remove {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
  }
  .analysis-navigation > .v-btn:last-child:not(:first-child) {
    grid-column: 1 / -1;
    grid-row: 2;
    justify-self: stretch;
    width: 100%;
    height: auto;
    padding-block: 12px;
  }
  .analysis-navigation :deep(.v-btn__content) {
    white-space: normal;
    overflow-wrap: anywhere;
  }
}
</style>

<style>
.ingredient-analysis-dialog .base-dialog-card {
  border-radius: 20px;
}
.ingredient-analysis-dialog .v-toolbar {
  border-bottom: 1px solid rgb(var(--v-theme-separator));
  height: auto !important;
}
.ingredient-analysis-dialog .v-toolbar__content {
  height: auto !important;
  min-height: 64px;
  padding-block: 8px;
  align-items: center;
}
.ingredient-analysis-dialog .v-card-actions {
  display: flex;
}
@media (max-width: 600px) {
  .ingredient-analysis-dialog .base-dialog-card {
    border-radius: 0;
  }
}
</style>
