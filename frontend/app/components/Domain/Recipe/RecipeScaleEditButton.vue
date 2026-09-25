<template>
  <div v-if="yieldDisplay" class="w-100">
    <div class="text-center d-flex align-center justify-center">
      <BaseButtonGroup v-if="canEditScale" class="pr-2" :large="false" rounded :buttons="[{
        icon: $globals.icons.minus,
        text: $t('recipe.decrease-scale-label'),
        event: 'decrement',
        disabled: disableDecrement,
      }]" @decrement="recalculateScale(yieldQuantity - 1)" />
      <v-number-input :model-value="yieldQuantity" :label="$t('recipe.servings')" :min="1" :precision="null"
        :disabled="!canEditScale" control-variant="hidden" density="compact" hide-details variant="solo"
        class="portion-input flex-grow-0" style="width: 90px; min-width: 90px; max-width: 90px"
        @update:model-value="recalculateScale" />
      <BaseButtonGroup v-if="canEditScale" class="pl-2" :large="false" rounded :buttons="[
        {
          icon: $globals.icons.createAlt,
          text: $t('recipe.increase-scale-label'),
          event: 'increment',
        },
      ]" @increment="recalculateScale(yieldQuantity + 1)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useScaledAmount } from "~/composables/recipes/use-scaled-amount";

interface Props {
  recipeServings?: number;
  editScale?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  recipeServings: 0,
  editScale: false,
});

const scale = defineModel<number>({ required: true });

const i18n = useI18n();
const canEditScale = computed(() => props.editScale && props.recipeServings > 0);

function recalculateScale(newYield: number | null) {
  if (newYield === null || !Number.isFinite(newYield) || newYield <= 0) {
    return;
  }

  if (props.recipeServings <= 0) {
    scale.value = 1;
  }
  else {
    scale.value = newYield / props.recipeServings;
  }
}

const recipeYieldAmount = computed(() => {
  return useScaledAmount(props.recipeServings, scale.value);
});
const yieldQuantity = computed(() => recipeYieldAmount.value.scaledAmount);
const yieldDisplay = computed(() => {
  return yieldQuantity.value
    ? i18n.t(
      "recipe.serves-amount", { amount: recipeYieldAmount.value.scaledAmountDisplay },
    ) as string
    : "";
});

const disableDecrement = computed(() => {
  return yieldQuantity.value <= 1;
});
</script>

<style scoped>
.portion-input,
.portion-input :deep(.v-field),
.portion-input :deep(.v-field--disabled) {
  opacity: 1 !important;
  background-color: rgb(var(--v-theme-surface)) !important;
}

.portion-input {
  border: 1px solid #212121;
  border-radius: 8px;
  overflow: hidden;
}

.portion-input :deep(.v-field) {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.portion-input :deep(.v-field__input) {
  justify-content: center;
  text-align: center;
}
</style>
