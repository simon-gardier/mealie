<template>
  <VueDraggable
    v-model="parsedIngs"
    class="review-list"
    handle=".handle"
    :delay="250"
    :delay-on-touch-only="true"
    :animation="200"
    ghost-class="recipe-drop-target"
    chosen-class="recipe-drag-chosen"
    drag-class="recipe-drag-active"
  >
    <div v-for="(ingredient, index) in parsedIngs" :key="rowKey(ingredient)" class="review-group">
      <details class="review-row">
        <summary>
          <span class="handle" :title="$t('recipe.parser.reorder-ingredient')" aria-hidden="true">
            <v-icon size="20">{{ $globals.icons.arrowUpDown }}</v-icon>
          </span>
          <span class="review-summary">
            <span class="review-name">{{ ingredientSummary(ingredient) }}</span>
            <span v-if="ingredient.ingredient.note && ingredient.ingredient.food" class="review-note">
              {{ ingredient.ingredient.note }}
            </span>
            <span v-if="needsAttention(ingredient)" class="review-attention">
              <v-icon size="16" color="warning">{{ $globals.icons.alert }}</v-icon>
              {{ $t('recipe.parser.needs-attention') }}
            </span>
          </span>
          <span class="review-edit">{{ $t('general.edit') }}<span class="review-chevron" aria-hidden="true" /></span>
        </summary>
        <div class="review-editor">
          <RecipeIngredientEditor
            v-model="ingredient.ingredient"
            show-field-labels

            enable-context-menu
            context-menu-below
            show-substitution-controls
            :delete-disabled="parsedIngs.length <= 1"
            @delete="parsedIngs.splice(index, 1)"
            @insert-above="insertNewIngredient(index)"
            @insert-below="insertNewIngredient(index + 1)"
          >
            <template #before-fields>
              <div v-if="ingredient.input" class="review-source">
                <span class="review-source-label">{{ $t('recipe.parser.source-text') }}</span>
                <p class="review-original">
                  {{ ingredient.input }}
                </p>
              </div>
            </template>
            <template #editor-actions>
              <div class="review-order-actions">
                <v-btn
                  variant="text"
                  size="small"
                  :disabled="index === 0"
                  :aria-label="$t('general.move-up')"
                  @click="moveIngredient(index, -1)"
                >
                  {{ $t('general.move-up') }}
                </v-btn>
                <v-btn
                  variant="text"
                  size="small"
                  :disabled="index === parsedIngs.length - 1"
                  :aria-label="$t('general.move-down')"
                  @click="moveIngredient(index, 1)"
                >
                  {{ $t('general.move-down') }}
                </v-btn>
              </div>
            </template>
          </RecipeIngredientEditor>
        </div>
      </details>
    </div>
  </VueDraggable>
</template>

<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";
import type { ParsedIngredient } from "~/lib/api/types/recipe";

const parsedIngs = defineModel<ParsedIngredient[]>({ required: true });
const i18n = useI18n();
const rowKeys = new WeakMap<ParsedIngredient, number>();
let nextKey = 0;
function rowKey(ingredient: ParsedIngredient) {
  if (!rowKeys.has(ingredient)) rowKeys.set(ingredient, nextKey++);
  return rowKeys.get(ingredient)!;
}
function needsAttention(parsed: ParsedIngredient) {
  return !parsed.ingredient.food && !parsed.ingredient.referencedRecipe;
}
function ingredientSummary(parsed: ParsedIngredient) {
  const ing = parsed.ingredient;
  if (needsAttention(parsed)) return parsed.input || ing.note || i18n.t("recipe.parser.empty-ingredient");
  const quantity = ing.quantity ? new Intl.NumberFormat(i18n.locale.value, { maximumFractionDigits: 3 }).format(ing.quantity) : "";
  const unit = ing.unit?.useAbbreviation ? ing.unit.abbreviation || ing.unit.name : ing.unit?.name;
  return [quantity, unit, ing.food?.name || ing.referencedRecipe?.name].filter(Boolean).join(" ");
}
function moveIngredient(index: number, direction: number) {
  const [ingredient] = parsedIngs.value.splice(index, 1);
  parsedIngs.value.splice(index + direction, 0, ingredient!);
}
function insertNewIngredient(index: number) {
  const ing = {
    input: "", confidence: {}, ingredient: { quantity: 0, referenceId: uuid4() },
  } as ParsedIngredient;
  parsedIngs.value.splice(index, 0, ing);
}
</script>

<style scoped>
.review-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.review-row {
  border: 1px solid rgb(var(--v-theme-separator));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
}
summary {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  min-height: 64px;
  cursor: pointer;
  list-style: none;
}
summary::-webkit-details-marker {
  display: none;
}
.review-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.review-name {
  line-height: 1.4;
  font-size: 0.9375rem;
  font-weight: 500;
}
.review-note,
.review-original {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-text-secondary), var(--v-secondary-label-opacity));
}
.review-original {
  margin: 4px 0 0;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.review-attention {
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
}
.review-edit {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  font-size: 0.8125rem;
  color: rgb(var(--v-theme-primary));
}
.handle {
  cursor: grab;
  color: rgba(var(--v-theme-text-secondary), var(--v-secondary-label-opacity));
  padding: 0;
  width: 20px;
  flex-shrink: 0;
}
.review-editor {
  padding: 16px;
  border-top: 1px solid rgb(var(--v-theme-separator));
}
.review-order-actions {
  gap: 4px;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
}
.review-source {
  padding: 12px;
  margin-bottom: 16px;
  border-radius: 10px;
  background: rgb(var(--v-theme-fill));
}
.review-source-label {
  font-size: 0.8125rem;
  font-weight: 600;
}
.review-chevron {
  width: 7px;
  height: 7px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg);
}
.review-row[open] .review-chevron {
  transform: rotate(225deg);
}
.review-order-actions .v-btn {
  min-height: 44px;
  font-size: 0.8125rem;
  text-transform: none;
  letter-spacing: normal;
}
@media (max-width: 600px) {
  summary {
    padding: 12px;
    gap: 8px;
  }
  .review-editor {
    padding: 12px;
  }
}
.review-section-title:has(.ingredient-section-title) {
  margin: 16px 0 12px;
}
/* Keep single-line review controls at the normal filled-field height. */
.review-editor :deep(.v-text-field .v-field__input) {
  box-sizing: border-box;
  min-height: 56px;
  height: 56px;
}
.review-editor :deep(.v-field__input > input) {
  min-height: 0;
  height: auto;
}
.review-editor :deep(.ingredient-editor-toolbar) {
  flex-wrap: nowrap;
  gap: 4px;
}
.review-order-actions {
  display: contents;
}
.review-editor :deep(.ingredient-editor-toolbar > .v-btn),
.review-order-actions .v-btn {
  min-width: 0;
  padding-inline: 6px;
  font-size: 13px;
  flex-shrink: 1;
}
.review-editor :deep(.ingredient-editor-toolbar > .ml-auto) {
  margin-left: auto !important;
  flex: 0 0 auto;
}
.review-editor :deep(.v-text-field .v-field) {
  --v-input-control-height: 56px;
}
/* Size the field surface too, not only its nested input. */
.review-editor :deep(.v-text-field .v-field) {
  box-sizing: border-box;
  height: 56px !important;
  min-height: 56px !important;
}
.review-editor :deep(.v-text-field .v-field__field) {
  min-height: 0;
}
.review-editor :deep(.v-text-field .v-field__input) {
  height: 56px !important;
  min-height: 56px !important;
}
.review-editor :deep(.v-field__input > input) {
  height: auto !important;
  min-height: 0 !important;
}
</style>
