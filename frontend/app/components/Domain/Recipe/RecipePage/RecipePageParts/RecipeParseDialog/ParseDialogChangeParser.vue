<template>
  <div class="ingredient-block px-4">
    <div class="ingredient-section-label">
      {{ $t("recipe.parser.analyzer") }}:
    </div>
    <div class="d-flex justify-center">
      <v-select v-model="currentParser" class="analyzer-select" :items="availableParsers.filter(({ hide }) => !hide)"
        item-title="text" item-value="value" variant="outlined" density="compact" hide-details
        :aria-label="$t('recipe.parser.select-parser')">
        <template v-if="showNlpLanguageHint" #append-inner>
          <v-tooltip location="top" max-width="400">
            <template #activator="{ props: tooltipProps }">
              <v-icon v-bind="tooltipProps" color="info">
                {{ $globals.icons.information }}
              </v-icon>
            </template>
            <span>{{ $t("recipe.parser.natural-language-processor-english-only") }}</span>
          </v-tooltip>
        </template>
      </v-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from "~/components/global/BaseOverflowButton.vue";
import type { Parser } from "~/lib/api/user/recipes/recipe";

defineProps<{ availableParsers: MenuItem[]; showNlpLanguageHint: boolean }>();
const emit = defineEmits<{ parse: [] }>();
const currentParser = defineModel<Parser>({ default: "nlp" });

watch(currentParser, () => emit("parse"));
</script>

<style scoped>
.ingredient-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ingredient-section-label {
  font-weight: 600;
  font-size: 0.95rem;
}

.analyzer-select {
  flex: 0 1 auto;
  width: fit-content;
}
</style>
