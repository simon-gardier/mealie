<template>
  <div v-if="yieldDisplay" class="w-100">
    <div class="text-center d-flex align-center justify-center">
      <BaseButtonGroup
        v-if="canEditScale"
        class="pr-2"
        :large="false"
        rounded
        :buttons="[{
          icon: $globals.icons.minus,
          text: $t('recipe.decrease-scale-label'),
          event: 'decrement',
          disabled: disableDecrement,
        }]"
        @decrement="recalculateScale(yieldQuantity - 1)"
      />
      <v-number-input
        :decimal-separator="quantityDecimalSeparator"
        :model-value="yieldQuantity"
        :label="$t('recipe.servings')"
        :min="minPortions"
        :precision="null"
        :disabled="!canEditScale"
        control-variant="hidden"
        density="compact"
        hide-details
        variant="filled"
        class="portion-input flex-grow-0"
        style="width: 90px; min-width: 90px; max-width: 90px"
        @update:model-value="recalculateScale"

        @beforeinput.capture="onQuantityInput"
        @paste.capture="onQuantityPaste"
      />
      <BaseButtonGroup
        v-if="canEditScale"
        class="pl-2"
        :large="false"
        rounded
        :buttons="[
          {
            icon: $globals.icons.createAlt,
            text: $t('recipe.increase-scale-label'),
            event: 'increment',
          },
        ]"
        @increment="recalculateScale(yieldQuantity + 1)"
      />
      <v-menu v-if="analysisRequired" location="bottom" max-width="360">
        <template #activator="{ props: infoProps }">
          <v-btn
            v-bind="infoProps"
            :icon="$globals.icons.information"
            variant="text"
            color="primary"
            class="ml-2"
            :aria-label="$t('shopping-list.analyze-before-scaling')"
          />
        </template>
        <v-sheet color="surface-elevated" class="pa-4 text-body-2" rounded="lg">
          {{ $t('shopping-list.analyze-before-scaling') }}
          <div v-if="unanalyzedSubrecipes.length" class="portion-subrecipes">
            <h3 class="portion-subrecipes-heading">
              <v-icon :icon="$globals.icons.potSteam" size="18" color="primary" />
              {{ $t('shopping-list.subrecipes-to-analyze') }}
            </h3>
            <ul class="portion-subrecipes-list">
              <li v-for="name in unanalyzedSubrecipes" :key="name">
                {{ name }}
              </li>
            </ul>
          </div>
        </v-sheet>
      </v-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuantityInput } from "~/composables/use-quantity-input";
import { useScaledAmount } from "~/composables/recipes/use-scaled-amount";

const { quantityDecimalSeparator, onQuantityInput, onQuantityPaste } = useQuantityInput();

interface Props {
  recipeServings?: number;
  editScale?: boolean;
  analysisRequired?: boolean;
  unanalyzedSubrecipes?: string[];
  minPortions?: number;
}
const props = withDefaults(defineProps<Props>(), {
  recipeServings: 0,
  editScale: false,
  analysisRequired: false,
  unanalyzedSubrecipes: () => [],
  minPortions: 1,
});

const scale = defineModel<number>({ required: true });

const i18n = useI18n();
const canEditScale = computed(() => props.editScale && props.recipeServings > 0);

function recalculateScale(newYield: number | null) {
  if (!canEditScale.value) return;
  if (newYield === null || !Number.isFinite(newYield) || newYield <= 0) {
    return;
  }

  if (props.recipeServings <= 0) {
    scale.value = 1;
  }
  else {
    scale.value = Math.max(props.minPortions, newYield) / props.recipeServings;
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
  return yieldQuantity.value <= props.minPortions;
});
</script>

<style scoped>
.portion-subrecipes {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--v-theme-separator), 0.5);
}
.portion-subrecipes-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  font: 500 13px/1.4 var(--bistro-body) !important;
  color: rgb(var(--v-theme-text-secondary));
}
.portion-subrecipes-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.portion-subrecipes-list li {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(var(--v-theme-fill), 0.5);
  color: rgb(var(--v-theme-on-surface));
  font: 500 14px/1.5 var(--bistro-body);
  overflow-wrap: anywhere;
}
.portion-input,
.portion-input :deep(.v-field) {
  background-color: rgb(var(--v-theme-surface)) !important;
}

.portion-input {
  border: 1px solid rgb(var(--v-theme-separator));
  border-radius: 10px;
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
