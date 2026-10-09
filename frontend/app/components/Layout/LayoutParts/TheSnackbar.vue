<template>
  <div class="text-center">
    <v-snackbar
      v-model="toastAlert.open"
      location="top"
      color="surface-elevated"
      class="petit-chef-toast"
      :timeout="toastAlert.timeout ?? 3500"
      rounded="lg"
      elevation="8"
      max-width="520"
    >
      <div class="toast-message" :role="toastAlert.color === 'error' ? 'alert' : 'status'">
        <v-icon v-if="icon" :color="toastAlert.color" :icon="icon" size="22" aria-hidden="true" />
        <div class="toast-copy">
          <strong v-if="toastAlert.title">{{ toastAlert.title }}</strong>
          <span>{{ toastAlert.text }}</span>
        </div>
      </div>

      <template #actions>
        <v-btn
          v-if="toastAlert.action"
          variant="text"
          color="primary"
          @click="() => {
            toastAlert.action?.onClick();
            toastAlert.open = false
          }"
        >
          {{ toastAlert.action.message ?? $t('general.close') }}
        </v-btn>
        <v-btn
          v-else
          icon
          variant="text"
          color="text-secondary"
          :aria-label="$t('general.close')"
          @click="toastAlert.open = false"
        >
          <v-icon :icon="$globals.icons.close" size="20" />
        </v-btn>
      </template>
    </v-snackbar>
    <v-snackbar
      v-model="toastLoading.open"
      content-class="py-2"
      density="compact"
      location="bottom"
      :timeout="-1"
      :color="toastLoading.color"
    >
      <div
        class="d-flex flex-column align-center justify-start"
        @click="toastLoading.open = false"
      >
        <div class="mb-2 mt-0 text-subtitle-1 text-center">
          {{ toastLoading.text }}
        </div>
        <v-progress-linear
          indeterminate
          color="on-primary"
        />
      </div>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useNuxtApp } from "#app";
import { toastAlert, toastLoading } from "~/composables/use-toast";

const { $globals } = useNuxtApp();
const icon = computed(() => {
  switch (toastAlert.color) {
    case "error":
      return $globals.icons.alertOutline;
    case "success":
      return $globals.icons.checkBold;
    case "info":
      return $globals.icons.informationOutline;
    case "warning":
      return $globals.icons.alertOutline;
    default:
      return $globals.icons.alertOutline;
  }
});
</script>

<style scoped>
.petit-chef-toast :deep(.v-snackbar__wrapper) {
  margin-top: max(16px, env(safe-area-inset-top));
  border: 1px solid rgba(var(--v-theme-separator), 0.6);
  border-radius: 16px !important;
  color: rgb(var(--v-theme-on-surface));
}
.petit-chef-toast :deep(.v-snackbar__content) {
  padding: 16px;
}
.toast-message {
  display: flex;
  align-items: center;
  gap: 12px;
}
.toast-copy {
  display: grid;
  gap: 4px;
  font-size: 14px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.toast-copy strong {
  font-weight: 600;
}
</style>
