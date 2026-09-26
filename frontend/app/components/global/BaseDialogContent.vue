<template>
  <v-card height="100%" :loading="loading" class="base-dialog-card">
    <template #loader="{ isActive }">
      <v-progress-linear :active="isActive" indeterminate />
    </template>
    <v-toolbar dark density="comfortable" :color="color" class="px-3 position-relative top-0 left-0 w-100"
      :class="{ 'dialog-title-centered': centerTitle }">
      <slot name="header">
        <img v-if="titleImage" :src="titleImage" alt="" aria-hidden="true" class="title-image">
        <v-icon v-else-if="icon" size="large">
          {{ icon }}
        </v-icon>
        <v-toolbar-title class="headline">
          {{ title }}
        </v-toolbar-title>
      </slot>
      <v-spacer v-if="centerTitle" />
      <v-btn v-if="cancelInToolbar" :aria-label="cancelLabel" :title="cancelLabel" icon variant="text"
        @click="emit('cancel')">
        <v-icon>{{ $globals.icons.close }}</v-icon>
      </v-btn>
    </v-toolbar>

    <div style="flex: 1 1 auto; min-height: 0; overflow: auto">
      <slot />
    </div>

    <v-spacer />
    <v-divider />
    <v-card-actions :class="$vuetify.display.xs ? 'pb-4 grid-small' : undefined">
      <slot name="card-actions">
        <v-btn v-if="!cancelInToolbar" variant="text" color="grey" @click="emit('cancel')">
          {{ cancelLabel }}
        </v-btn>
        <slot name="card-actions-left" />
        <v-spacer v-if="!$vuetify.display.xs && !expandCardActionsLeft" />
        <div class="dialog-footer-center">
          <slot name="card-actions-center" />
        </div>
        <v-spacer v-if="!$vuetify.display.xs && !expandCardActionsLeft" />
        <slot name="custom-card-action" />
        <BaseButton v-if="canDelete" delete @click="emit('delete')" />
        <BaseButton v-if="canConfirm" :color="color" type="submit" :disabled="submitDisabled" @click="emit('confirm')">
          <template #icon>
            {{ $globals.icons.check }}
          </template>
          {{ $t("general.confirm") }}
        </BaseButton>
        <BaseButton v-if="canSubmit" type="submit" :disabled="submitDisabled || loading" :hide-icon="hideSubmitIcon"
          @click="emit('submit')">
          {{ submitLabel }}
          <template v-if="submitIcon" #icon>
            {{ submitIcon }}
          </template>
        </BaseButton>
      </slot>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { useGlobalI18n } from "~/composables/use-global-i18n";

interface DialogProps {
  color?: string;
  title?: string;
  icon?: string | null;
  titleImage?: string | null;
  centerTitle?: boolean;
  cancelInToolbar?: boolean;
  loading?: boolean;

  // submit
  submitIcon?: string | null;
  hideSubmitIcon?: boolean;
  submitText?: string;
  submitDisabled?: boolean;

  // cancel
  cancelText?: string;

  // actions
  canDelete?: boolean;
  canConfirm?: boolean;
  canSubmit?: boolean;
  expandCardActionsLeft?: boolean;
}

interface DialogEmits {
  (e: "submit" | "cancel" | "confirm" | "delete"): void;
}

// Using TypeScript interface with withDefaults for props
const props = withDefaults(defineProps<DialogProps>(), {
  color: "primary",
  title: "Modal Title",
  icon: null,
  titleImage: null,
  centerTitle: false,
  cancelInToolbar: false,
  loading: false,

  // submit
  submitIcon: null,
  hideSubmitIcon: false,
  submitDisabled: false,

  // actions
  canDelete: false,
  canConfirm: false,
  canSubmit: false,
  expandCardActionsLeft: false,
});
const emit = defineEmits<DialogEmits>();

const i18n = useGlobalI18n();

const submitLabel = computed(() => props.submitText ?? i18n.t("general.create"));
const cancelLabel = computed(() => props.cancelText ?? i18n.t("general.cancel"));
</script>

<style scoped>
/* On extra-small displays the dialog is a bottom sheet or fullscreen, so the
   actions stretch evenly across the full width. Larger displays keep the
   default v-card-actions flex row, where the spacer pushes the actions right. */
.grid-small {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(min-content, 1fr);
}

.title-image {
  width: 32px;
  height: 32px;
  margin-right: 6px;
  object-fit: contain;
}

.dialog-title-centered .v-toolbar-title {
  position: absolute;
  right: 64px;
  left: 64px;
  text-align: center;
}

.dialog-footer-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
</style>
