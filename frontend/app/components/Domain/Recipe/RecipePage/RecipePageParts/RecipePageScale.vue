<template>
  <div class="d-flex justify-space-between align-center" :class="compact ? 'pa-0' : 'pt-2 pb-3'">
    <RecipeScaleEditButton
      v-if="!isEditMode"
      v-model.number="scale"
      :recipe-servings="recipeServings"
      :edit-scale="ingredientsAnalyzed && !isEditMode"
      :analysis-required="!ingredientsAnalyzed"
      :unanalyzed-subrecipes="unanalyzedSubrecipeNames(recipe.recipeIngredient)"
    />
  </div>
</template>

<script setup lang="ts">
import type { RecipeView } from "~/lib/recipe/recipe-view";
import RecipeScaleEditButton from "~/components/Domain/Recipe/RecipeScaleEditButton.vue";
import { usePageState } from "~/composables/recipe-page/shared-state";
import { canScaleShoppingRecipe, unanalyzedSubrecipeNames } from "~/lib/shopping-recipe-portions";

const props = withDefaults(defineProps<{ recipe: RecipeView; compact?: boolean }>(), {
  compact: false,
});

const scale = defineModel<number>({ default: 1 });

const { isEditMode } = usePageState(props.recipe.slug);

const recipeServings = computed<number>(() => {
  return props.recipe.recipeServings || props.recipe.recipeYieldQuantity || 1;
});

const ingredientsAnalyzed = computed(() => canScaleShoppingRecipe(props.recipe.recipeIngredient));
</script>
