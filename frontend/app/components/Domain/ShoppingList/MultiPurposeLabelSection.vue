<template>
  <div class="d-flex justify-space-between align-center ga-3">
    <div class="handle d-flex align-center ga-3">
      <v-icon :color="labelColor">
        {{ $globals.icons.tags }}
      </v-icon>
      <span>{{ modelValue.label.name }}</span>
    </div>
    <v-btn
      class="handle tag-reorder-handle"
      icon
      variant="text"
      color="text-secondary"
      :aria-label="`${$t('shopping-list.reorder-labels')}: ${modelValue.label.name}`"
      :ripple="false"
    >
      <v-icon>{{ $globals.icons.arrowUpDown }}</v-icon>
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import type { ShoppingListMultiPurposeLabelOut } from "~/lib/api/types/household";

const props = defineProps<{
  useColor?: boolean;
}>();
const modelValue = defineModel<ShoppingListMultiPurposeLabelOut>({ required: true });

const labelColor = computed(() => props.useColor ? modelValue.value.label.color : undefined);
</script>

<style scoped>
.tag-reorder-handle {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  cursor: grab;
  touch-action: none;
}
.handle {
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
