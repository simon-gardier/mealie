<template>
  <v-menu location="bottom" width="340" max-width="calc(100vw - 32px)" content-class="recipe-editor-overlay">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        :icon="$globals.icons.information"
        variant="text"
        color="primary"
        :aria-label="$t('tag.about-tags')"
        class="tag-info-button"
        @click.stop
      />
    </template>
    <v-sheet color="surface-elevated" rounded="lg" class="tag-info-content" role="note">
      <p>{{ $t('tag.purpose') }}</p>
      <p>{{ $t('tag.categories-difference') }}</p>
      <p>{{ $t('tag.filtering-help') }}</p>
    </v-sheet>
  </v-menu>
</template>

<style scoped>
.tag-info-button {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 10px;
}
.tag-info-content {
  padding: 16px;
  font: 400 14px/1.5 var(--bistro-body);
  color: rgb(var(--v-theme-on-surface));
}
.tag-info-content p + p {
  margin-top: 12px;
}
</style>
