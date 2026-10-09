<template>
  <v-toolbar
    color="transparent"
    flat
  >
    <BaseButton
      color="primary"
      variant="text"
      class="navigation-button"
      @click="$router.go(-1)"
    >
      <template #icon>
        {{ $globals.icons.back }}
      </template>
      {{ $t('general.back') }}
    </BaseButton>
    <slot />
  </v-toolbar>
</template>

<script setup lang="ts">
defineProps({
  back: {
    type: Boolean,
    default: false,
  },
});
</script>

<style lang="scss" scoped>
</style>
