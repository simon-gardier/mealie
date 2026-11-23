<template>
  <div class="recipe-info-editor">
    <v-text-field
      v-model="recipe.name"
      class="my-1"
      :label="$t('recipe.recipe-name')"
      :rules="[validators.required]"
      density="comfortable"
      variant="filled"
    />
    <v-container class="ma-0 pa-0">
      <v-row>
        <v-col cols="12" sm="3" class="py-1">
          <v-number-input
            :decimal-separator="quantityDecimalSeparator"
            :model-value="recipe.recipeServings"
            :min="0"
            :precision="null"
            density="comfortable"
            :label="$t('recipe.servings')"
            variant="filled"
            control-variant="hidden"
            @update:model-value="recipe.recipeServings = $event"

            @beforeinput.capture="onQuantityInput"
            @paste.capture="onQuantityPaste"
          />
        </v-col>
        <v-col cols="12" sm="3" class="py-1">
          <v-number-input
            :decimal-separator="quantityDecimalSeparator"
            :model-value="recipe.recipeYieldQuantity"
            :min="0"
            :precision="null"
            density="comfortable"
            :label="$t('recipe.yield')"
            variant="filled"
            control-variant="hidden"
            @update:model-value="recipe.recipeYieldQuantity = $event"

            @beforeinput.capture="onQuantityInput"
            @paste.capture="onQuantityPaste"
          />
        </v-col>
        <v-col cols="12" sm="6" class="py-1">
          <v-text-field
            v-model="recipe.recipeYield"
            density="comfortable"
            :label="$t('recipe.yield-text')"
            variant="filled"
          />
        </v-col>
      </v-row>
    </v-container>

    <!-- Structured hours/minutes keep scaling and time summaries accurate; the text keeps extra wording -->
    <div class="d-flex flex-column ga-2 my-2">
      <RecipeTimeInput
        v-model:seconds="recipe.totalTimeSeconds"
        v-model:text="recipe.totalTime"
        :label="$t('recipe.total-time')"
      />
      <RecipeTimeInput
        v-model:seconds="recipe.prepTimeSeconds"
        v-model:text="recipe.prepTime"
        :label="$t('recipe.prep-time')"
      />
      <RecipeTimeInput
        v-model:seconds="recipe.performTimeSeconds"
        v-model:text="recipe.performTime"
        :label="$t('recipe.perform-time')"
      />
    </div>
    <v-textarea
      v-model="recipe.description"
      class="my-1"
      auto-grow
      min-height="100"
      :label="$t('recipe.description')"
      density="comfortable"
      variant="filled"
    />
  </div>
</template>

<script setup lang="ts">
import type { RecipeView } from "~/lib/recipe/recipe-view";
import RecipeTimeInput from "~/components/Domain/Recipe/RecipeTimeInput.vue";
import { useQuantityInput } from "~/composables/use-quantity-input";
import { validators } from "~/composables/use-validators";

const { quantityDecimalSeparator, onQuantityInput, onQuantityPaste } = useQuantityInput();

const recipe = defineModel<RecipeView>({ required: true });
</script>
