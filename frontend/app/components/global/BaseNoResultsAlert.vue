<template>
  <v-alert type="info" variant="text" :icon="false" class="base-no-results-alert">
    <div class="d-flex flex-column align-center text-center ga-3">
      <span class="base-no-results-alert__text">{{ text }}</span>
      <img src="/remy_error.png" alt="" class="base-no-results-alert__image">
    </div>
  </v-alert>
</template>

<script setup lang="ts">
defineProps({
  text: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.base-no-results-alert :deep(.v-alert__content) {
  width: 100%;
}

.base-no-results-alert__image {
  width: 432px;
  height: 432px;
  object-fit: contain;
}

.base-no-results-alert__text {
  font-size: 1.25rem;
}
</style>
