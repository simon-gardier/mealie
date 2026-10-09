<template>
  <v-card class="ma-0 pt-2" :elevation="4">
    <v-card-text>
      <div class="d-flex justify-center flex-wrap ga-2 mb-4">
        <v-btn
          v-for="control in controls.flat()"
          :key="control.icon"
          :icon="control.icon"
          :color="control.color"
          :title="$t(control.label)"
          :aria-label="$t(control.label)"
          :disabled="submitted"
          variant="tonal"
          @click="control.callback()"
        />
      </div>

      <Cropper
        ref="cropper"
        class="cropper"
        :src="img"
        :default-size="defaultSize"
        :style="`width: ${cropperWidth}; aspect-ratio: ${aspectRatio};`"
        @change="changed = changed + 1"
        @ready="onReady"
        @error="onImageError"
      />
    </v-card-text>
    <v-card-actions v-if="!hideActions" class="px-4 pb-4">
      <v-btn variant="text" color="secondary" :disabled="submitted" @click="cancel">
        {{ cancelText || $t("general.cancel") }}
      </v-btn>
      <v-btn
        v-if="!hideDelete"
        color="error"
        variant="text"
        :icon="deleteText ? undefined : $globals.icons.delete"
        :title="$t('general.delete')"
        :aria-label="$t('general.delete')"
        :disabled="submitted"
        @click="$emit('delete')"
      >
        <template v-if="deleteText">
          {{ deleteText }}
        </template>
      </v-btn>
      <v-spacer />
      <v-btn
        color="primary"
        :variant="saveVariant"
        :prepend-icon="$globals.icons.save"
        :disabled="submitted || !changed"
        :loading="submitted"
        @click="save"
      >
        {{ saveText || $t("general.save") }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

defineProps({
  saveText: { type: String, default: "" },
  cancelText: { type: String, default: "" },
  deleteText: { type: String, default: "" },
  saveVariant: { type: String as () => "tonal" | "elevated", default: "elevated" },
  img: {
    type: String,
    required: true,
  },
  cropperWidth: {
    type: String,
    default: undefined,
  },
  hideActions: {
    type: Boolean,
    default: false,
  },
  hideDelete: {
    type: Boolean,
    default: false,
  },
  submitted: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: "save", item: Blob): void;
  (e: "delete" | "cancel" | "error"): void;
}>();

const cropper = ref<any>(null);
const changed = ref(0);
const ready = ref(false);
// Left to the cropper's own sizing until the image is rotated; see rotate().
const aspectRatio = ref<string | number>("auto");
const { $globals } = useNuxtApp();

function onImageError() {
  ready.value = false;
  emit("error");
}

function onReady() {
  ready.value = true;
  aspectRatio.value = "auto";
  changed.value = -1;
}

type Control = {
  color: string;
  icon: string;
  label: string;
  callback: CallableFunction;
};

function flip(hortizontal: boolean, vertical?: boolean) {
  if (!cropper.value) return;
  cropper.value.flip(hortizontal, vertical);
  changed.value = changed.value + 1;
}

async function rotate(angle: number) {
  if (!cropper.value) return;
  cropper.value.rotate(angle);
  changed.value = changed.value + 1;

  // A quarter turn swaps the image's width and height. Pin the box to the new
  // orientation, otherwise the cropper keeps the visible area it computed for
  // the old one and part of the rotated image ends up outside of it.
  const { image } = cropper.value.getResult();
  const quarterTurned = Math.abs(image.transforms.rotate % 180) === 90;
  aspectRatio.value = quarterTurned ? image.height / image.width : image.width / image.height;

  // the cropper measures its own box, so let the new size land first
  await nextTick();
  cropper.value.refresh();
}

const controls = ref<Control[][]>([
  [
    {
      color: "info",
      icon: $globals.icons.flipHorizontal,
      label: "recipe.image-flipHorizontal",
      callback: () => flip(true, false),
    },
    {
      color: "info",
      icon: $globals.icons.flipVertical,
      label: "recipe.image-flipVertical",
      callback: () => flip(false, true),
    },
  ],
  [
    {
      color: "info",
      icon: $globals.icons.rotateLeft,
      label: "recipe.image-rotateLeft",
      callback: () => rotate(-90),
    },
    {
      color: "info",
      icon: $globals.icons.rotateRight,
      label: "recipe.image-rotateRight",
      callback: () => rotate(90),
    },
  ],
]);

function cancel() {
  cropper.value?.reset();
  aspectRatio.value = "auto";
  changed.value = 0;
  emit("cancel");
}

function save() {
  if (!cropper.value) return;
  const { canvas } = cropper.value.getResult();
  if (!canvas) return;
  canvas.toBlob((blob) => {
    if (blob) {
      emit("save", blob);
    }
  });
}

defineExpose({ save, ready, canSave: computed(() => !!changed.value) });

function defaultSize({ imageSize, visibleArea }: any) {
  return {
    width: (visibleArea || imageSize).width,
    height: (visibleArea || imageSize).height,
  };
}
</script>
