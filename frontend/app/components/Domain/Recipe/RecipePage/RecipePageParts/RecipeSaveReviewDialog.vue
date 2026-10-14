<template>
  <BaseDialog
    :model-value="modelValue"
    bottom-sheet
    width="600"
    content-class="recipe-save-review-dialog"
    :title="$t('recipe.save-review.title')"
    :cancel-text="$t('recipe.save-review.edit')"
    disable-submit-on-enter
    @update:model-value="!$event && emit('cancel')"
    @cancel="emit('cancel')"
    @close="emit('cancel')"
  >
    <template #header>
      <v-icon :icon="$globals.icons.alertCircle" color="warning" size="24" aria-hidden="true" />
      <v-toolbar-title class="dialog-title">
        {{ $t('recipe.save-review.title') }}
      </v-toolbar-title>
    </template>
    <v-card-text class="recipe-save-review-body">
      <p>{{ $t('recipe.save-review.description') }}</p>
      <section v-if="currentWarning" :key="currentWarning.code" class="recipe-save-review-issue">
        <h3 class="recipe-save-review-category-title">
          {{ $t(`recipe.save-review.${currentWarning.code}.title`, { count: currentWarning.count }) }}
        </h3>
        <ul v-if="affectedItems(currentWarning).length" class="recipe-save-review-affected">
          <li v-for="(item, index) in affectedItems(currentWarning)" :key="index">
            {{ item }}
          </li>
        </ul>
        <p class="recipe-save-review-problem">
          <strong>{{ $t('recipe.save-review.problem-label') }}</strong>
          {{ $t(`recipe.save-review.${currentWarning.code}.problem`) }}
        </p>
        <p class="recipe-save-review-consequence">
          <strong>{{ $t('recipe.save-review.consequence-label') }}</strong>
          {{ $t(`recipe.save-review.${currentWarning.code}.consequence`) }}
        </p>
      </section>
    </v-card-text>
    <template #card-actions>
      <div class="recipe-save-review-footer">
        <nav v-if="warnings.length > 1" class="recipe-save-review-navigation" :aria-label="$t('recipe.save-review.navigation')">
          <v-btn color="primary" variant="text" :disabled="issueIndex === 0" @click="issueIndex--">
            {{ $t('recipe.save-review.previous') }}
          </v-btn>
          <span role="status" aria-live="polite" aria-atomic="true" class="recipe-save-review-counter">
            {{ $t('recipe.save-review.position', { current: issueIndex + 1, total: warnings.length }) }}
          </span>
          <v-btn color="primary" variant="text" :disabled="issueIndex >= warnings.length - 1" @click="issueIndex++">
            {{ $t('recipe.save-review.next') }}
          </v-btn>
        </nav>
        <div class="recipe-save-review-actions">
          <BaseButton
            color="primary"
            variant="text"
            :text="$t('recipe.save-review.edit')"
            :icon="$globals.icons.edit"
            @click="emit('cancel')"
          />
          <BaseButton
            color="warning"
            variant="tonal"
            :text="$t('recipe.save-review.save')"
            :icon="$globals.icons.save"
            @click="emit('confirm')"
          />
        </div>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import type { Recipe } from "~/lib/api/types/recipe";
import type { RecipeSaveWarning } from "~/lib/recipe/save-warnings";

const props = defineProps<{ modelValue: boolean; warnings: RecipeSaveWarning[]; recipe: Recipe }>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();
const { t } = useI18n();
const issueIndex = ref(0);
const currentWarning = computed(() => props.warnings[issueIndex.value]);
watch(() => props.modelValue, (open) => {
  if (open) issueIndex.value = 0;
});
watch(() => props.warnings.length, (length) => {
  issueIndex.value = Math.min(issueIndex.value, Math.max(0, length - 1));
});
function ingredientText(index: number): string {
  const ingredient = props.recipe.recipeIngredient?.[index - 1];
  return excerpt(ingredient?.food?.name || ingredient?.referencedRecipe?.name || ingredient?.note || ingredient?.originalText);
}
function excerpt(text?: string | null): string {
  const value = text?.trim() || t("recipe.save-review.empty-value");
  return value.length > 120 ? `${value.slice(0, 117)}…` : value;
}
function affectedItems(warning: RecipeSaveWarning): string[] {
  const items = warning.substitutes?.map((item) => {
    const note = props.recipe.recipeIngredient?.[item.ingredient - 1]?.substitutions?.[item.substitute - 1]?.note;
    return t("recipe.save-review.named-substitute-location", {
      ...item, name: ingredientText(item.ingredient), note: excerpt(note),
    });
  }) ?? warning.ingredients?.map(ingredient => t("recipe.save-review.named-ingredient-location", {
    ingredient, name: ingredientText(ingredient),
  })) ?? (warning.code === "excess-categories"
    ? props.recipe.recipeCategory?.map(item => item.name)
    : warning.code === "excess-tags" ? props.recipe.tags?.map(item => item.name) : []) ?? [];
  const visible = items.slice(0, 5);
  if (items.length > 5) visible.push(t("recipe.save-review.more-items", { count: items.length - 5 }));
  return visible;
}
</script>

<style>
.recipe-save-review-dialog .dialog-title {
  font-family: var(--bistro-body) !important;
  font-size: 18px;
  font-weight: 600;
}
.recipe-save-review-body {
  padding: 24px;
  font: 400 14px/1.5 var(--bistro-body);
}
.recipe-save-review-issue {
  margin-top: 24px;
}
.recipe-save-review-footer {
  width: 100%;
  display: grid;
  gap: 16px;
}
.recipe-save-review-navigation {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
}
.recipe-save-review-navigation .v-btn {
  min-height: 44px;
  border-radius: 10px;
  text-transform: none;
  padding-inline: 8px;
}
.recipe-save-review-counter {
  color: rgb(var(--v-theme-text-secondary));
  font: 400 13px/1.4 var(--bistro-body);
  text-align: center;
}
.recipe-save-review-category-title {
  margin: 0 0 8px;
  font: 600 16px/1.4 var(--bistro-body);
  font-family: var(--bistro-body) !important;
  color: rgb(var(--v-theme-on-surface));
}
.recipe-save-review-issue strong {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}
.recipe-save-review-problem,
.recipe-save-review-consequence {
  margin-top: 12px;
  margin-bottom: 0;
  color: rgb(var(--v-theme-text-secondary));
  overflow-wrap: anywhere;
}
.recipe-save-review-affected {
  list-style: none;
  margin: 8px 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgb(var(--v-theme-fill));
  color: rgb(var(--v-theme-on-surface));
  display: grid;
  gap: 6px;
  overflow-wrap: anywhere;
}
.recipe-save-review-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}
.recipe-save-review-actions .v-btn {
  min-height: 44px;
  height: auto;
  padding-block: 10px;
  border-radius: 10px;
}
.recipe-save-review-actions .v-btn__content {
  white-space: normal;
}
@media (max-width: 599px) {
  .recipe-save-review-body {
    padding: 16px;
  }
}
</style>
