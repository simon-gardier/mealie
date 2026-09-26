<template>
  <div>
    <v-text-field v-model="recipe.name" class="my-1" :label="$t('recipe.recipe-name')" :rules="[validators.required]"
      density="default" variant="outlined" />
    <v-container class="ma-0 pa-0">
      <v-row>
        <v-col cols="12" sm="3" class="py-1">
          <v-number-input :model-value="recipe.recipeServings" :min="0" :precision="null" density="default"
            :label="$t('recipe.servings')" variant="outlined" control-variant="hidden"
            @update:model-value="recipe.recipeServings = $event" />
        </v-col>
        <v-col cols="12" sm="3" class="py-1">
          <v-number-input :model-value="recipe.recipeYieldQuantity" :min="0" :precision="null" density="default"
            :label="$t('recipe.yield')" variant="outlined" control-variant="hidden"
            @update:model-value="recipe.recipeYieldQuantity = $event" />
        </v-col>
        <v-col cols="12" sm="6" class="py-1">
          <v-text-field v-model="recipe.recipeYield" density="default" :label="$t('recipe.yield-text')"
            variant="outlined" />
        </v-col>
      </v-row>
    </v-container>

    <v-row>
      <v-col cols="12" sm="4" class="py-1">
        <v-text-field v-model="recipe.totalTime" :label="$t('recipe.total-time')" density="default"
          variant="outlined" />
      </v-col>
      <v-col cols="12" sm="4" class="py-1">
        <v-text-field v-model="recipe.prepTime" :label="$t('recipe.prep-time')" density="default" variant="outlined" />
      </v-col>
      <v-col cols="12" sm="4" class="py-1">
        <v-text-field v-model="recipe.performTime" :label="$t('recipe.perform-time')" density="default"
          variant="outlined" />
      </v-col>
    </v-row>
    <v-textarea v-model="recipe.description" class="my-1" auto-grow min-height="100" :label="$t('recipe.description')"
      density="default" variant="outlined" />
  </div>
</template>

<script setup lang="ts">
import { validators } from "~/composables/use-validators";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import type { Recipe } from "~/lib/api/types/recipe";

const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });
</script>
