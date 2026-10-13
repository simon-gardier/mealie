<template>
  <v-tooltip :disabled="!disabled && !always" :text="message" location="bottom" :open-on-click="disabled">
    <template #activator="{ props: tooltipProps }">
      <div
        v-bind="tooltipProps"
        class="disabled-action-tooltip"
        :class="{ 'disabled-action-tooltip--block': block }"
        :tabindex="disabled ? 0 : undefined"
        :aria-label="disabled ? message : undefined"
        :role="disabled ? 'group' : undefined"
        @click="handleClick"
      >
        <slot />
      </div>
    </template>
  </v-tooltip>
</template>

<script setup lang="ts">
const props = defineProps<{ disabled: boolean; message: string; block?: boolean; always?: boolean }>();

function handleClick(event: MouseEvent) {
  if (!props.disabled) return;
  // Card links can still navigate by their native default action even when
  // propagation is stopped. Cancel both while preserving tooltip activation.
  event.preventDefault();
  event.stopPropagation();
}
</script>

<style scoped>
.disabled-action-tooltip {
  display: inline-flex;
  border-radius: 10px;
}
.disabled-action-tooltip--block {
  display: block;
}
.disabled-action-tooltip:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>
