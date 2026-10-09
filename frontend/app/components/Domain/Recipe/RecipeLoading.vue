<template>
  <div class="recipe-loading" role="status" aria-live="polite" aria-atomic="true">
    <span class="recipe-loading__spinner" aria-hidden="true">
      <span v-for="segment in 12" :key="segment" :style="{ '--segment': segment - 1 }" />
    </span>
    <span><slot>{{ label ?? $t('general.loading-recipes') }}</slot></span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label?: string }>();
</script>

<style scoped>
.recipe-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 96px;
  padding: 24px 16px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 14px;
  font-weight: 500;
}

.recipe-loading__spinner {
  position: relative;
  flex: 0 0 24px;
  height: 24px;
}

.recipe-loading__spinner span {
  position: absolute;
  top: 0;
  left: 10.5px;
  width: 3px;
  height: 7px;
  border-radius: 3px;
  background: currentColor;
  transform-origin: 1.5px 12px;
  transform: rotate(calc(var(--segment) * 30deg));
  opacity: 0.2;
  animation: recipe-loading-pulse 1.2s linear infinite;
  animation-delay: calc(var(--segment) * -0.1s);
}

@keyframes recipe-loading-pulse {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0.2;
  }
}

@media (prefers-reduced-motion: reduce) {
  .recipe-loading__spinner span {
    animation: none;
    opacity: calc(0.2 + var(--segment) * 0.065);
  }
}
</style>
