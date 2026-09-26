<template>
  <div class="mt-4">
    <section class="d-flex flex-column align-center">
      <slot name="header" />
      <v-img v-if="titleImage" :src="titleImage" :alt="titleImageAlt" class="title-image" max-width="360" />
      <h2 :class="['text-h5', { 'sr-only': titleImage }]">
        <slot name="title">
          👋 Here's a Title
        </slot>
      </h2>

      <h3 class="subtitle-1">
        <slot />
      </h3>
    </section>
    <section class="d-flex">
      <slot name="content" />
    </section>
    <v-divider v-if="divider" class="my-4" />
  </div>
</template>

<script setup lang="ts">
defineProps({
  divider: {
    type: Boolean,
    default: false,
  },
  titleImage: {
    type: String,
    default: null,
  },
  titleImageAlt: {
    type: String,
    default: "",
  },
});
</script>

<style scoped>
.title-image {
  width: min(100%, 360px);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.subtitle-1 {
  font-size: 1rem;
  font-weight: normal;
  color: var(--v-text-caption);
}
</style>
