<template>
  <div v-if="yieldDisplay">
    <div class="text-center d-flex align-center">
      <v-card class="pa-1 px-2" dark color="secondary-darken-1">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-html="yieldDisplay" />
      </v-card>
      <BaseButtonGroup v-if="canEditScale" class="pl-2" :large="false" :buttons="[
        {
          icon: $globals.icons.minus,
          text: $t('recipe.decrease-scale-label'),
          event: 'decrement',
          disabled: disableDecrement,
        },
        {
          icon: $globals.icons.createAlt,
          text: $t('recipe.increase-scale-label'),
          event: 'increment',
        },
      ]" @decrement="recalculateScale(yieldQuantity - 1)" @increment="recalculateScale(yieldQuantity + 1)" />
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

function recalculateScale(newYield: number) {
  if (isNaN(newYield) || newYield <= 0) {
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
