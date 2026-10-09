<template>
  <p class="base-empty-state">
    <v-icon v-if="icon" :icon="icon" size="20" aria-hidden="true" />
    <span>{{ message }}</span>
  </p>
</template>

<script setup lang="ts">
defineProps<{ message: string; icon?: string }>();
</script>

<style scoped>
.base-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  margin-block: 16px;
  border-radius: 12px;
  background: rgb(var(--v-theme-fill));
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
}
</style>
