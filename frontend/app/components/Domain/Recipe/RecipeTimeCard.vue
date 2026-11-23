<template>
  <div v-if="_showCards" class="recipe-time-container">
    <div class="recipe-times" :style="{ '--time-columns': timeItems.length }">
      <div v-for="item in timeItems" :key="item.name" class="recipe-time-item">
        <v-icon :size="small ? 20 : 24" color="primary">
          {{ item.icon }}
        </v-icon>
        <div>
          <p class="recipe-time-label">
            {{ item.name }}
          </p>
          <p class="recipe-time-value">
            {{ item.value }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRecipeTime } from "~/composables/recipes";

interface Props {
  prepTime?: string | null;
  totalTime?: string | null;
  performTime?: string | null;
  prepTimeSeconds?: number | null;
  totalTimeSeconds?: number | null;
  performTimeSeconds?: number | null;
  color?: string;
  small?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  prepTime: null,
  totalTime: null,
  performTime: null,
  prepTimeSeconds: null,
  totalTimeSeconds: null,
  performTimeSeconds: null,
  color: "accent custom-transparent",
  small: false,
});

const i18n = useI18n();
const { recipeTimeDisplay } = useRecipeTime();

const totalTime = computed(() => recipeTimeDisplay(props.totalTimeSeconds, props.totalTime));
const prepTime = computed(() => recipeTimeDisplay(props.prepTimeSeconds, props.prepTime));
const performTime = computed(() => recipeTimeDisplay(props.performTimeSeconds, props.performTime));

const _showCards = computed(() => {
  return [prepTime.value, totalTime.value, performTime.value].some(x => !!x);
});

const validateTotalTime = computed(() => {
  return totalTime.value ? { name: i18n.t("recipe.total-time"), value: totalTime.value } : null;
});

const validatePrepTime = computed(() => {
  return prepTime.value ? { name: i18n.t("recipe.prep-time"), value: prepTime.value } : null;
});

const validatePerformTime = computed(() => {
  return performTime.value ? { name: i18n.t("recipe.perform-time"), value: performTime.value } : null;
});

const { $globals } = useNuxtApp();
const timeItems = computed(() => [
  { ...validateTotalTime.value, icon: $globals.icons.clockOutline },
  { ...validatePrepTime.value, icon: $globals.icons.knife },
  { ...validatePerformTime.value, icon: $globals.icons.potSteam },
].filter(item => item.name));
</script>

<style scoped>
.recipe-time-container {
  container-type: inline-size;
  width: 100%;
}
.recipe-times {
  display: grid;
  grid-template-columns: repeat(var(--time-columns), minmax(0, 1fr));
  gap: 16px;
}
.recipe-time-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
}
.recipe-time-label {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
}
.recipe-time-value {
  font-size: 15px;
  line-height: 1.5;
}
@container (max-width: 600px) {
  .recipe-times {
    grid-template-columns: 1fr;
  }
}
</style>
