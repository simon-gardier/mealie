<template>
  <div class="text-center">
    <BaseDialog
      v-model="dialogDeleteImage"
      bottom-sheet
      :title="$t('recipe.delete-image')"
      :icon="$globals.icons.alertCircle"
      color="error"
      can-delete
      @delete="deleteImage"
    >
      <v-card-text>
        {{ $t("recipe.delete-image-confirmation") }}
      </v-card-text>
    </BaseDialog>
    <BaseDialog
      v-model="dialogReframeImage"
      :title="$t('recipe.edit-image')"
      width="800"
      :loading="loading"
      :keep-open="loading"
    >
      <ImageCropper
        v-if="dialogReframeImage && editorImageUrl"
        ref="reframeCropper"
        :img="editorImageUrl"
        cropper-width="100%"
        :submitted="loading"
        hide-delete
        hide-actions
        @save="saveReframedImage"
        @error="alert.error(i18n.t('recipe.image-preview-failed'))"
        @cancel="dialogReframeImage = false"
      />
      <template #card-actions>
        <v-btn variant="text" color="secondary" :disabled="loading" @click="dialogReframeImage = false">
          {{ $t("general.cancel") }}
        </v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          variant="tonal"
          :prepend-icon="$globals.icons.save"
          :disabled="loading || !reframeCropper?.ready || (!stagedImageUrl && !reframeCropper?.canSave)"
          :loading="loading"
          @click="reframeCropper?.save()"
        >
          {{ $t("general.save") }}
        </v-btn>
      </template>
    </BaseDialog>
    <v-menu v-model="menu" content-class="recipe-editor-overlay" location="bottom end" :close-on-content-click="false">
      <template #activator="{ props: activatorProps }">
        <v-btn
          color="primary"
          class="editor-action rounded-circle"
          size="small"
          variant="tonal"
          icon
          v-bind="activatorProps"
          :aria-label="$t('recipe.recipe-image')"
        >
          <v-icon>{{ $globals.icons.fileImage }}</v-icon>
        </v-btn>
      </template>
      <v-card class="recipe-image-menu rounded-xl" width="380">
        <v-card-title class="px-5 pt-5">
          {{ $t("recipe.recipe-image") }}
        </v-card-title>
        <v-card-text class="px-5 pb-4">
          <p class="text-body-2 mb-4">
            {{ $t("recipe.image-preview-before-save") }}
          </p>
          <input ref="fileInput" type="file" accept="image/*" class="d-none" @change="selectImage">
          <v-btn
            block
            color="primary"
            variant="tonal"
            :prepend-icon="$globals.icons.upload"
            :disabled="!slug || loading"
            @click="fileInput?.click()"
          >
            {{ $t("recipe.import-image") }}
          </v-btn>
          <v-btn
            block
            class="mt-3"
            color="primary"
            variant="outlined"
            :prepend-icon="$globals.icons.edit"
            :disabled="!slug || !currentImageUrl || loading"
            @click="openReframeImage"
          >
            {{ $t("recipe.reframe-image") }}
          </v-btn>
          <v-divider class="my-4" />
          <v-text-field
            v-model="url"
            :label="$t('recipe.image-url')"
            type="url"
            variant="filled"
            density="compact"
            hide-details
            :disabled="loading || !slug"
            @keydown.enter.prevent="getImageFromURL"
          />
          <v-btn
            block
            class="mt-2"
            color="primary"
            variant="tonal"
            :loading="loading"
            :disabled="!slug || !validImageUrl || loading"
            @click="getImageFromURL"
          >
            {{ $t("recipe.preview-image") }}
          </v-btn>
          <p v-if="!slug" class="text-body-2 mt-3">
            {{ $t("recipe.save-recipe-before-use") }}
          </p>
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-4 py-2">
          <v-btn
            color="error"
            variant="text"
            :prepend-icon="$globals.icons.delete"
            :disabled="!slug || !currentImageUrl || loading"
            @click="openDeleteImage"
          >
            {{ $t("recipe.delete-image") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { alertUnreportedError, alert } from "~/composables/use-toast";
import { useUserApi } from "~/composables/api";

const DELETE_EVENT = "delete";
const REFRESH_EVENT = "refresh";

const props = defineProps<{ slug: string; currentImageUrl?: string }>();

const emit = defineEmits<{
  refresh: [image: string];

  delete: [];
}>();

const i18n = useI18n();
const api = useUserApi();

const url = ref("");
const loading = ref(false);
const menu = ref(false);
const dialogDeleteImage = ref(false);
const dialogReframeImage = ref(false);
const reframeCropper = ref<{ save: () => void; canSave: boolean; ready: boolean } | null>(null);

const fileInput = ref<HTMLInputElement | null>(null);
const stagedImageUrl = ref("");
const editorImageUrl = computed(() => stagedImageUrl.value || props.currentImageUrl);
const validImageUrl = computed(() => {
  try {
    return ["http:", "https:"].includes(new URL(url.value.trim()).protocol);
  }
  catch {
    return false;
  }
});
function clearStagedImage() {
  if (stagedImageUrl.value) URL.revokeObjectURL(stagedImageUrl.value);
  stagedImageUrl.value = "";
}
watch(dialogReframeImage, (open) => {
  if (!open) clearStagedImage();
});
onBeforeUnmount(clearStagedImage);
function previewImage(blob: Blob) {
  clearStagedImage();
  stagedImageUrl.value = URL.createObjectURL(blob);
  menu.value = false;
  dialogReframeImage.value = true;
}
function selectImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || loading.value || !props.slug) return;
  if (file.type && !file.type.startsWith("image/")) {
    alert.error(i18n.t("recipe.image-preview-failed"));
    return;
  }
  previewImage(file);
}
function openDeleteImage() {
  menu.value = false;
  dialogDeleteImage.value = true;
}
function openReframeImage() {
  clearStagedImage();
  menu.value = false;
  dialogReframeImage.value = true;
}

async function saveReframedImage(blob: Blob) {
  if (loading.value || !props.slug) return;
  loading.value = true;
  try {
    const image = new File([blob], "reframed-recipe.png", { type: blob.type || "image/png" });
    const { data, error } = await api.recipes.updateImage(props.slug, image);
    if (error || !data?.image) {
      alertUnreportedError(error, i18n.t("events.something-went-wrong"));
      return;
    }
    emit(REFRESH_EVENT, data.image);
    dialogReframeImage.value = false;
  }
  catch {
    alertUnreportedError(null, i18n.t("events.something-went-wrong"));
  }
  finally {
    loading.value = false;
  }
}

async function deleteImage() {
  loading.value = true;
  const { error } = await api.recipes.deleteImage(props.slug);
  loading.value = false;

  if (error) {
    alertUnreportedError(error, i18n.t("events.something-went-wrong"));
    return;
  }

  emit(DELETE_EVENT);
  menu.value = false;
}

async function getImageFromURL() {
  if (loading.value || !props.slug || !validImageUrl.value) return;
  loading.value = true;
  try {
    const response = await fetch(url.value.trim(), { credentials: "omit" });
    if (!response.ok) throw new Error("Image download failed");
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) throw new Error("URL did not return an image");
    previewImage(blob);
  }
  catch {
    alert.error(i18n.t("recipe.image-preview-failed"));
  }
  finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.recipe-image-menu {
  max-width: calc(100vw - 24px);
}
</style>
