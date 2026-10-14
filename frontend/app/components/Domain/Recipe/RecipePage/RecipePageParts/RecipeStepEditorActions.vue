<template>
  <BaseButtonGroup
    :large="false"
    rounded
    :buttons="[
      {
        icon: preview ? $globals.icons.edit : $globals.icons.eye,
        text: preview ? $t('recipe.edit-markdown') : $t('markdown-editor.preview-markdown-button-label'),
        event: 'preview-step',
      },
      { icon: $globals.icons.upload, text: $t('recipe.upload-image'), event: 'upload-image' },
      { icon: $globals.icons.delete, text: $t('general.delete'), event: 'delete' },
      {
        icon: $globals.icons.dotsVertical,
        text: '',
        event: 'open',
        children: [
          ...(!showTitle ? [{
            icon: $globals.icons.textBox,
            text: $t('recipe.editor.add-section-before'),
            event: 'toggle-section',
          }] : []),
          { icon: $globals.icons.link, text: $t('recipe.link-references'), event: 'link-references' },
          { icon: $globals.icons.swapHorizontal, text: $t('recipe.merge-above'), event: 'merge-above' },
          { icon: $globals.icons.arrowUp, text: $t('recipe.move-to-top'), event: 'move-to-top' },
          { icon: $globals.icons.arrowDown, text: $t('recipe.move-to-bottom'), event: 'move-to-bottom' },
          { icon: $globals.icons.arrowUp, text: $t('recipe.editor.insert-step-before'), event: 'insert-above' },
          { icon: $globals.icons.arrowDown, text: $t('recipe.editor.insert-step-after'), event: 'insert-below' },
        ],
      },
    ]"
    @merge-above="emit('merge-above')"
    @move-to-top="emit('move-to-top')"
    @move-to-bottom="emit('move-to-bottom')"
    @insert-above="emit('insert-above')"
    @insert-below="emit('insert-below')"
    @toggle-section="emit('toggle-section')"
    @link-references="emit('link-references')"
    @preview-step="emit('preview-step')"
    @upload-image="emit('upload-image')"
    @delete="emit('delete')"
  />
</template>

<script setup lang="ts">
defineProps<{ preview?: boolean; showTitle?: boolean }>();
const emit = defineEmits<{
  "merge-above": [];
  "move-to-top": [];
  "move-to-bottom": [];
  "insert-above": [];
  "insert-below": [];
  "toggle-section": [];
  "link-references": [];
  "preview-step": [];
  "upload-image": [];
  "delete": [];
}>();
</script>
