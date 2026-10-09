<template>
  <div :class="{ 'recipe-notes-editor': edit, 'recipe-notes-view': !edit }" class="mt-8">
    <h2 class="my-4 text-h5 font-weight-medium opacity-80">
      {{ $t("recipe.note") }}
    </h2>
    <BaseEmptyState
      v-if="model.length === 0 && !edit"
      :message="$t('recipe.no-notes')"
      :icon="$globals.icons.noteTextOutline"
    />
    <div v-for="(note, index) in model" :id="'note' + index" :key="note.referenceId || 'note' + index" class="mt-1">
      <v-card v-if="edit">
        <v-card-text>
          <div class="d-flex align-center">
            <v-text-field
              v-model="model[index]['title']"
              class="flex-grow-1"
              variant="filled"
              hide-details
              :label="$t('recipe.title')"
            />
          </div>
          <div class="note-toolbar d-flex justify-end mt-3 mb-4">
            <v-btn
              variant="plain"
              color="primary"
              icon
              :aria-label="$t(preview.get(note) ? 'recipe.note-show-code' : 'markdown-editor.preview-markdown-button-label')"
              :aria-pressed="!!preview.get(note)"
              @click="preview.set(note, !preview.get(note))"
            >
              <v-icon>{{ preview.get(note) ? $globals.icons.codeTags : $globals.icons.eye }}</v-icon>
              <v-tooltip activator="parent" location="bottom">
                {{ $t(preview.get(note) ? 'recipe.note-show-code' : 'markdown-editor.preview-markdown-button-label') }}
              </v-tooltip>
            </v-btn>
            <v-btn
              v-if="slug && recipeId"
              variant="plain"
              color="primary"
              icon
              :aria-label="$t('recipe.note-add-image')"
              :loading="uploading.get(note)"
              :disabled="uploading.get(note)"
              @click="chooseImage(note)"
            >
              <v-icon>{{ $globals.icons.upload }}</v-icon>
              <v-tooltip activator="parent" location="bottom">
                {{ $t('recipe.note-add-image') }}
              </v-tooltip>
            </v-btn>
            <v-btn
              color="error"
              variant="plain"
              :aria-label="$t('general.delete')"
              icon
              class="note-delete"
              elevation="0"
              :disabled="uploading.get(note)"
              @click="removeByIndex(index)"
            >
              <v-icon>{{ $globals.icons.delete }}</v-icon>
              <v-tooltip activator="parent" location="bottom">
                {{ $t('general.delete') }}
              </v-tooltip>
            </v-btn>
          </div>
          <v-textarea
            v-if="!preview.get(note)"
            v-model="model[index]['text']"
            variant="filled"
            auto-grow
            :label="$t('recipe.note')"
          />
          <div v-else class="note-preview">
            <SafeMarkdown v-if="note.text" :source="note.text" />
            <BaseEmptyState v-else :message="$t('recipe.no-notes')" :icon="$globals.icons.noteTextOutline" />
          </div>
        </v-card-text>
      </v-card>
      <div v-else>
        <v-card-title class="text-subtitle-1 font-weight-medium py-1">
          {{ note.title }}
        </v-card-title>
        <v-card-text>
          <SafeMarkdown :source="note.text" />
        </v-card-text>
      </div>
    </div>

    <div v-if="edit" class="d-flex justify-center">
      <BaseButton variant="tonal" class="my-2" @click="addNote">
        {{ $t("recipe.editor.add-note") }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { uuid4 } from "~/composables/use-utils";
import type { RecipeNote, RecipeAsset } from "~/lib/api/types/recipe";
import { useStaticRoutes, useUserApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";

const model = defineModel<RecipeNote[]>({ default: () => [] });
const assets = defineModel<RecipeAsset[]>("assets", { default: () => [] });

const props = defineProps({
  slug: { type: String, default: "" },
  recipeId: { type: String, default: "" },
  edit: {
    type: Boolean,
    default: true,
  },
});

const preview = reactive(new WeakMap<RecipeNote, boolean>());
const uploading = reactive(new WeakMap<RecipeNote, boolean>());
const api = useUserApi();
const { recipeAssetPath } = useStaticRoutes();
const i18n = useI18n();

function chooseImage(note: RecipeNote) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) void addImage(note, file);
    input.remove();
  };
  input.click();
}

async function addImage(note: RecipeNote, file: File) {
  if (!props.slug || !props.recipeId || uploading.get(note)) return;
  uploading.set(note, true);
  try {
    const { data } = await api.recipes.createAsset(props.slug, {
      name: file.name, icon: "mdi-file-image", file, extension: file.name.split(".").pop() || "",
    });
    if (!data?.fileName) throw new Error("Image upload failed");
    assets.value = [...assets.value, data];
    if (model.value.includes(note)) {
      const url = recipeAssetPath(props.recipeId, data.fileName);
      note.text = `${note.text || ""}\n\n![](${encodeURI(url).replace(/\(/g, "%28").replace(/\)/g, "%29")})`;
    }
  }
  catch { alert.error(i18n.t("recipe.failed-to-attach-image")); }
  finally { uploading.delete(note); }
}

function addNote() {
  model.value = [...model.value, { title: "", text: "", referenceId: uuid4() }];
}

function removeByIndex(index: number) {
  const newNotes = [...model.value];
  newNotes.splice(index, 1);
  model.value = newNotes;
}
</script>

<style scoped>
.note-toolbar {
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(var(--v-theme-separator), 0.5);
}
.note-toolbar .v-btn {
  min-height: 44px;
  height: auto;
  border-radius: 10px;
}
.note-preview {
  padding: 16px;
  border: 1px solid rgb(var(--v-theme-separator));
  border-radius: 12px;
}
.recipe-notes-editor :deep(img),
.recipe-notes-view :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
}
</style>
