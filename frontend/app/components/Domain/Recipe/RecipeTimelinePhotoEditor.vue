<template>
  <section class="timeline-photo-editor">
    <h3>{{ $t('recipe.optional-photo') }}</h3>
    <p v-if="preview" class="photo-hint">
      {{ $t('recipe.crop-before-saving') }}
    </p>
    <div v-if="!preview" class="photo-upload">
      <AppButtonUpload
        url="none"
        file-name="image"
        accept="image/*"
        :text="$t('recipe.upload-image')"
        :text-btn="false"
        :post="false"
        @uploaded="emit('upload', $event)"
      />
    </div>
    <ImageCropper
      v-else
      class="photo-cropper"
      :img="preview"
      cropper-width="100%"
      :save-text="$t('recipe.apply-crop')"
      :cancel-text="$t('recipe.reset-crop')"
      :delete-text="$t('recipe.remove-photo')"
      save-variant="tonal"
      :submitted="submitted"
      @save="emit('crop', $event)"
      @delete="emit('remove')"
    />
  </section>
</template>

<script setup lang="ts">
defineProps<{ preview?: string; submitted?: boolean }>();
const emit = defineEmits<{ upload: [file: File]; crop: [file: Blob]; remove: [] }>();
</script>

<style scoped>
.timeline-photo-editor {
  margin-top: 24px;
  text-align: left;
}
h3 {
  font-family: var(--bistro-body);
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}
.photo-hint {
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 12px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
.photo-upload {
  display: flex;
  justify-content: center;
}
.photo-cropper {
  box-shadow: none !important;
  border: 1px solid rgb(var(--v-theme-separator));
  border-radius: 14px;
}
.photo-cropper :deep(.v-card-text) {
  padding: 12px;
}
.photo-cropper :deep(.v-card-actions .v-btn) {
  min-height: 44px;
  border-radius: 10px;
}
</style>
