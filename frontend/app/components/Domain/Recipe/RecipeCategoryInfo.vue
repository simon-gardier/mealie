<template>
  <v-menu location="bottom" width="340" max-width="calc(100vw - 32px)" content-class="recipe-editor-overlay">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        :icon="$globals.icons.information"
        variant="text"
        color="primary"
        :aria-label="$t('category.about-categories')"
        class="category-info-button"
        @click.stop
      />
    </template>
    <v-sheet color="surface-elevated" rounded="lg" class="category-info-content" role="note">
      <p>{{ $t('category.purpose') }}</p>
      <p>{{ $t('category.tags-difference') }}</p>
      <p>{{ $t('category.filtering-help') }}</p>
    </v-sheet>
  </v-menu>
</template>

<style scoped>
.category-info-button {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 10px;
}
.category-info-content {
  padding: 16px;
  font: 400 14px/1.5 var(--bistro-body);
  color: rgb(var(--v-theme-on-surface));
}
.category-info-content p + p {
  margin-top: 12px;
}
</style>
