<template>
  <div class="action-panel">
    <p class="action-panel-description">
      {{ description }}
    </p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ description: string }>();
</script>

<style scoped>
.action-panel {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 10px;
  background: rgb(var(--v-theme-fill));
}
.action-panel-description {
  font-size: 0.8125rem;
  line-height: 1.4;
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
