<template>
  <section class="import-images">
    <input
      ref="fileInput"
      class="d-none"
      type="file"
      accept="image/*"
      multiple
      :disabled="disabled"
      @change="selectImages"
    >
    <v-btn
      variant="tonal"
      color="primary"
      :prepend-icon="$globals.icons.createAlt"
      :disabled="disabled"
      class="import-images-action"
      type="button"
      @click="fileInput?.click()"
    >
      {{ images.length ? $t('recipe.upload-more-images') : $t('recipe.upload-images') }}
    </v-btn>
    <p v-if="images.length" class="import-images-hint">
      {{ $t('recipe.crop-and-rotate-the-image') }}
    </p>
    <div v-if="images.length" class="import-images-grid">
      <article v-for="(imageUrl, index) in previewUrls" :key="imageUrl" class="import-image-card">
        <img :src="imageUrl" :alt="$t('recipe.recipe-image')" class="import-image-preview">
        <div class="import-image-actions">
          <v-btn
            variant="tonal"
            color="primary"
            :prepend-icon="$globals.icons.edit"
            :disabled="disabled"
            type="button"
            @click="openEditor(index)"
          >
            {{ $t('recipe.reframe-image') }}
          </v-btn>
          <v-btn
            variant="text"
            color="error"
            :prepend-icon="$globals.icons.delete"
            :disabled="disabled"
            type="button"
            @click="clearImage(index)"
          >
            {{ $t('recipe.remove-photo') }}
          </v-btn>
          <v-btn
            v-if="images.length > 1"
            variant="text"
            color="primary"
            :prepend-icon="index === 0 ? $globals.icons.check : $globals.icons.fileImage"
            :disabled="disabled || index === 0"
            type="button"
            @click="setCoverImage(index)"
          >
            {{ index === 0 ? $t('recipe.cover-image') : $t('recipe.set-as-cover-image') }}
          </v-btn>
        </div>
      </article>
    </div>

    <BaseDialog v-model="editorOpen" :title="$t('recipe.edit-image')" width="800">
      <ImageCropper
        v-if="editorOpen && editorImageUrl"
        ref="cropper"
        class="import-image-cropper"
        :img="editorImageUrl"
        cropper-width="100%"
        :submitted="disabled"
        hide-delete
        hide-actions
        @save="applyCrop"
        @error="previewFailed"
      />
      <template #card-actions>
        <v-btn variant="text" color="secondary" type="button" @click="editorOpen = false">
          {{ $t('general.cancel') }}
        </v-btn>
        <v-spacer />
        <v-btn
          variant="tonal"
          color="primary"
          :prepend-icon="$globals.icons.check"
          :disabled="disabled || !cropper?.ready || !cropper?.canSave"
          type="button"
          @click="cropper?.save()"
        >
          {{ $t('recipe.apply-crop') }}
        </v-btn>
      </template>
    </BaseDialog>
  </section>
</template>

<script setup lang="ts">
import { alert } from "~/composables/use-toast";

const props = withDefaults(defineProps<{
  disabled?: boolean;
  calm?: boolean;
}>(), {
  disabled: false,
  calm: false,
});

const i18n = useI18n();
const images = defineModel<(Blob | File)[]>({ default: () => [] });
const fileInput = ref<HTMLInputElement | null>(null);
const previewUrls = ref<string[]>([]);
const editorOpen = ref(false);
const editorIndex = ref<number | null>(null);
const editorImageUrl = computed(() => editorIndex.value === null ? undefined : previewUrls.value[editorIndex.value]);
const cropper = ref<{ save: () => void; ready: boolean; canSave: boolean } | null>(null);

function selectImages(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []).filter(file => file.type.startsWith("image/"));
  input.value = "";
  if (props.disabled || !files.length) return;
  images.value = [...images.value, ...files];
}

watch(images, (files) => {
  const previous = previewUrls.value;
  previewUrls.value = files.map(file => URL.createObjectURL(file));
  previous.forEach(url => URL.revokeObjectURL(url));
}, { immediate: true });

function openEditor(index: number) {
  if (props.disabled) return;
  editorIndex.value = index;
  editorOpen.value = true;
}

function clearImage(index: number) {
  if (props.disabled) return;
  editorOpen.value = false;
  images.value = images.value.filter((_, itemIndex) => itemIndex !== index);
}

function applyCrop(blob: Blob) {
  const index = editorIndex.value;
  if (props.disabled || index === null || !images.value[index]) return;
  images.value = images.value.map((image, itemIndex) => itemIndex === index ? blob : image);
  editorOpen.value = false;
}

function previewFailed() {
  alert.error(i18n.t("recipe.image-preview-failed"));
}

function setCoverImage(index: number) {
  if (props.disabled || index <= 0 || index >= images.value.length) return;
  editorOpen.value = false;
  const reordered = [...images.value];
  [reordered[0], reordered[index]] = [reordered[index]!, reordered[0]!];
  images.value = reordered;
}

watch(editorOpen, (open) => {
  if (!open) editorIndex.value = null;
});

onBeforeUnmount(() => {
  previewUrls.value.forEach(url => URL.revokeObjectURL(url));
});
</script>

<style scoped>
.import-images {
  min-width: 0;
  container-type: inline-size;
}
.import-images-action,
.import-image-actions :deep(.v-btn) {
  min-height: 44px;
  height: auto;
  padding: 10px 16px;
  border-radius: 10px;
  text-transform: none;
}
.import-images-action :deep(.v-btn__content),
.import-image-actions :deep(.v-btn__content) {
  white-space: normal;
}
.import-images-hint {
  color: rgb(var(--v-theme-text-secondary));
  font: 400 13px/1.5 var(--bistro-body);
}
.import-images-hint {
  margin-block: 16px 12px;
}
.import-images-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}
.import-image-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgb(var(--v-theme-separator));
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
}
.import-image-preview {
  display: block;
  width: 100%;
  height: 220px;
  object-fit: contain;
  padding: 12px;
  background: rgba(var(--v-theme-fill), 0.4);
}
.import-image-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
}
.import-image-cropper {
  width: 100%;
  box-shadow: none !important;
  background: transparent;
}
.import-image-cropper :deep(.v-card-text) {
  padding: 16px;
}
.import-image-cropper :deep(.v-btn--icon) {
  width: 44px;
  height: 44px;
  border-radius: 10px;
}
@container (min-width: 600px) {
  .import-images-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
