<template>
  <v-text-field v-model="step.summary">
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
import type { RecipeStep } from "~/lib/api/types/recipe";

// Keep summary reads in this component, rather than subscribing the entire step list.
// Nested edits remain synchronous so Save always sees the latest title.
const step = defineModel<RecipeStep>("step", { required: true });
</script>
