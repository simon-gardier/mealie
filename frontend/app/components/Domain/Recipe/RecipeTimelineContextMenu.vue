<template>
  <div class="text-center">
    <BaseDialog
      v-model="recipeEventEditDialog"
      :title="$t('recipe.edit-timeline-event')"
      :icon="$globals.icons.edit"
      can-submit
      disable-submit-on-enter
      :submit-text="$t('general.save')"
      :loading="loading"
      :submit-disabled="loading"
      :width="560"
      @submit="submitEdit"
    >
      <v-card-text>
        <v-form ref="domEditEventForm">
          <v-text-field v-model="localEvent.subject" :label="$t('general.subject')" />
          <v-textarea v-model="localEvent.eventMessage" :label="$t('general.message')" rows="4" />
          <RecipeTimelinePhotoEditor :preview="imagePreview" :submitted="loading" @upload="selectImage" @crop="applyCrop" @remove="removeImage" />
        </v-form>
      </v-card-text>
    </BaseDialog>

    <BaseDialog
      v-model="recipeEventDeleteDialog"
      bottom-sheet
      :title="$t('events.delete-event')"
      color="error"
      :icon="$globals.icons.alertCircle"
      can-confirm
      @confirm="$emit('delete')"
    >
      <v-card-text>
        {{ $t('events.event-delete-confirmation') }}
      </v-card-text>
    </BaseDialog>

    <v-menu
      offset-y
      start
      :bottom="!props.menuTop"
      :nudge-bottom="!props.menuTop ? '5' : '0'"
      :top="props.menuTop"
      :nudge-top="props.menuTop ? '5' : '0'"
      allow-overflow
      close-delay="125"
      content-class="d-print-none"
    >
      <template #activator="{ props: btnProps }">
        <v-btn
          class="recipe-timeline-menu-button"
          :class="{ 'rounded-circle': props.fab }"
          :x-small="props.fab"
          :elevation="props.elevation ?? undefined"
          :color="props.color"
          :icon="!props.fab"
          v-bind="btnProps"
          @click.prevent
        >
          <v-icon>{{ icon }}</v-icon>
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item
          v-for="(item, index) in menuItems"
          :key="index"
          @click="contextMenuEventHandler(item.event)"
        >
          <template #prepend>
            <v-icon :color="item.color">
              {{ item.icon }}
            </v-icon>
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import RecipeTimelinePhotoEditor from "./RecipeTimelinePhotoEditor.vue";
import { useI18n, useNuxtApp } from "#imports";
import type { RecipeTimelineEventOut } from "~/lib/api/types/recipe";
import { useUserApi, useStaticRoutes } from "~/composables/api";
import { alert } from "~/composables/use-toast";

export interface TimelineContextMenuIncludes {
  edit: boolean;
  delete: boolean;
}

export interface ContextMenuItem {
  title: string;
  icon: string;
  color: string | undefined;
  event: string;
}

const props = defineProps<{
  useItems?: TimelineContextMenuIncludes;
  appendItems?: ContextMenuItem[];
  leadingItems?: ContextMenuItem[];
  menuTop?: boolean;
  fab?: boolean;
  elevation?: number | null;
  color?: string;
  event: RecipeTimelineEventOut;
  menuIcon?: string | null;
}>();

const emit = defineEmits(["delete", "update"]);

const domEditEventForm = ref();
const recipeEventEditDialog = ref(false);
const recipeEventDeleteDialog = ref(false);
const loading = ref(false);

const i18n = useI18n();
const { $globals } = useNuxtApp();

const defaultItems: { [key: string]: ContextMenuItem } = {
  edit: {
    title: i18n.t("general.edit"),
    icon: $globals.icons.edit,
    color: undefined,
    event: "edit",
  },
  delete: {
    title: i18n.t("general.delete"),
    icon: $globals.icons.delete,
    color: "error",
    event: "delete",
  },
};

const menuItems = computed(() => {
  const items: ContextMenuItem[] = [];
  const useItems = props.useItems ?? { edit: true, delete: true };
  for (const [key, value] of Object.entries(useItems)) {
    if (value) {
      const item = defaultItems[key];
      if (item) items.push(item);
    }
  }
  return [
    ...items,
    ...(props.leadingItems ?? []),
    ...(props.appendItems ?? []),
  ];
});

const icon = computed(() => props.menuIcon || $globals.icons.dotsVertical);

const localEvent = ref({ ...props.event });
const api = useUserApi();
const { recipeTimelineEventImage } = useStaticRoutes();
const imagePreview = ref("");
const pendingImage = ref<Blob | File>();
const imageName = ref("photo.png");
let objectUrl = "";
function releasePreview() {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = "";
}
function setImage(file: Blob | File) {
  releasePreview();
  pendingImage.value = file;
  objectUrl = URL.createObjectURL(file);
  imagePreview.value = objectUrl;
}
function selectImage(file: File) {
  imageName.value = file.name;
  setImage(file);
}
function applyCrop(file: Blob) {
  imageName.value = "photo.png";
  setImage(file);
}
function removeImage() {
  releasePreview();
  pendingImage.value = undefined;
  imagePreview.value = "";
  localEvent.value.image = "does not have image";
}
onBeforeUnmount(releasePreview);
watch(() => props.event, (val) => {
  localEvent.value = { ...val };
});

function openEditDialog() {
  releasePreview();
  pendingImage.value = undefined;
  localEvent.value = { ...props.event };
  imagePreview.value = props.event.image === "has image" ? `${recipeTimelineEventImage(props.event.recipeId, props.event.id)}?v=${Date.now()}` : "";
  recipeEventEditDialog.value = true;
}
function openDeleteDialog() {
  recipeEventDeleteDialog.value = true;
}
function contextMenuEventHandler(eventKey: string) {
  if (eventKey === "edit") {
    openEditDialog();
    loading.value = false;
    return;
  }
  if (eventKey === "delete") {
    openDeleteDialog();
    loading.value = false;
    return;
  }
  emit(eventKey as "delete" | "update");
  loading.value = false;
}
async function submitEdit() {
  if (loading.value) return;
  loading.value = true;
  try {
    if (pendingImage.value) {
      const { response } = await api.recipes.updateTimelineEventImage(props.event.id, pendingImage.value, imageName.value);
      if (!response || response.status >= 400) {
        alert.error(i18n.t("events.something-went-wrong"));
        return;
      }
      localEvent.value.image = "has image";
      pendingImage.value = undefined;
    }
    emit("update", { ...localEvent.value });
    recipeEventEditDialog.value = false;
  }
  catch {
    alert.error(i18n.t("events.something-went-wrong"));
  }
  finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.photo-heading {
  font-family: var(--bistro-body);
  font-size: 15px;
  text-align: left;
  margin: 8px 0 12px;
}
.recipe-timeline-menu-button {
  width: 40px;
  min-width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%;
}
</style>
