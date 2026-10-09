<template>
  <span class="base-loading-spinner" aria-hidden="true" />
</template>

<style scoped>
.base-loading-spinner {
  display: inline-block;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: 3px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  /* Only transform changes, so the compositor can animate during Vue mounts. */
  will-change: transform;
  animation: loading-spin 800ms linear infinite;
}

@keyframes loading-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .base-loading-spinner {
    animation: none;
    will-change: auto;
  }
}
</style>
