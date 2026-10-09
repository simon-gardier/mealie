<template>
  <v-container fluid class="narrow-container">
    <BaseDialog
      v-model="state.storageDetails"
      bottom-sheet
      :title="$t('admin.maintenance.storage-details')"
      :icon="$globals.icons.folderOutline"
    >
      <div class="py-2">
        <template v-for="(value, key, idx) in storageDetails" :key="`item-${key}`">
          <v-list-item>
            <v-list-item-title>
              <div>{{ storageDetailsText(key) }}</div>
            </v-list-item-title>
            <v-list-item-subtitle class="text-end">
              {{ value }}
            </v-list-item-subtitle>
          </v-list-item>
          <v-divider v-if="idx != 4" :key="`divider-${key}`" class="mx-2" />
        </template>
      </div>
    </BaseDialog>

    <BasePageTitle>
      <template #title>
        {{ $t("admin.maintenance.page-title") }}
      </template>
    </BasePageTitle>

    <section>
      <BaseCardSectionTitle class="pb-0" :icon="$globals.icons.wrench" :title="$t('admin.maintenance.summary-title')" />
      <div class="maintenance-summary-actions">
        <BaseButton color="primary" variant="tonal" :loading="state.fetchingInfo" @click="getSummary">
          <template #icon>
            {{ $globals.icons.tools }}
          </template>
          {{ $t("admin.maintenance.button-label-get-summary") }}
        </BaseButton>
        <BaseButton color="primary" variant="text" :loading="state.storageDetailsLoading" @click="openDetails">
          <template #icon>
            {{ $globals.icons.folderOutline }}
          </template>
          {{ $t("admin.maintenance.button-label-open-details") }}
        </BaseButton>
      </div>
      <v-card class="maintenance-summary" :loading="state.fetchingInfo">
        <template v-for="(value, idx) in info" :key="`item-${idx}`">
          <v-list-item>
            <v-list-item-title class="py-2">
              <div>{{ value.name }}</div>
              <v-list-item-subtitle class="text-end">
                {{ value.value }}
              </v-list-item-subtitle>
            </v-list-item-title>
          </v-list-item>
          <v-divider class="mx-2" />
        </template>
      </v-card>
    </section>
    <section>
      <BaseCardSectionTitle
        class="pb-0 mt-8"
        :icon="$globals.icons.wrench"
        :title="$t('admin.mainentance.actions-title')"
      >
        <i18n-t keypath="admin.maintenance.actions-description">
          <template #destructive_in_bold>
            <b>{{ $t("admin.maintenance.actions-description-destructive") }}</b>
          </template>
          <template #irreversible_in_bold>
            <b>{{ $t("admin.maintenance.actions-description-irreversible") }}</b>
          </template>
        </i18n-t>
      </BaseCardSectionTitle>
      <div class="maintenance-action-list">
        <article v-for="(action, idx) in actions" :key="`item-${idx}`" class="maintenance-action-card">
          <h3>{{ action.name }}</h3>
          <p>{{ action.subtitle }}</p>
          <v-btn variant="tonal" color="error" :prepend-icon="$globals.icons.delete" :disabled="state.actionLoading" @click="action.handler">
            {{ action.name }}
          </v-btn>
        </article>
      </div>
    </section>
  </v-container>
</template>

<script setup lang="ts">
import { useAdminApi } from "~/composables/api";
import type { MaintenanceStorageDetails, MaintenanceSummary } from "~/lib/api/types/admin";

definePageMeta({
  layout: "admin",
});

const state = reactive({
  storageDetails: false,
  storageDetailsLoading: false,
  fetchingInfo: false,
  actionLoading: false,
});

const adminApi = useAdminApi();
const i18n = useI18n();

// Set page title
useSeoMeta({
  title: i18n.t("admin.maintenance.page-title"),
});

// ==========================================================================
// General Info

const infoResults = ref<MaintenanceSummary>({
  dataDirSize: i18n.t("about.unknown-version"),
  cleanableDirs: 0,
  cleanableImages: 0,
});

async function getSummary() {
  state.fetchingInfo = true;
  const { data } = await adminApi.maintenance.getInfo();

  infoResults.value = data ?? {
    dataDirSize: i18n.t("about.unknown-version"),
    cleanableDirs: 0,
    cleanableImages: 0,
  };

  state.fetchingInfo = false;
}

const info = computed(() => {
  return [
    {
      name: i18n.t("admin.maintenance.info-description-data-dir-size"),
      value: infoResults.value.dataDirSize,
    },
    {
      name: i18n.t("admin.maintenance.info-description-cleanable-directories"),
      value: infoResults.value.cleanableDirs,
    },
    {
      name: i18n.t("admin.maintenance.info-description-cleanable-images"),
      value: infoResults.value.cleanableImages,
    },
  ];
});

// ==========================================================================
// Storage Details

const storageTitles: { [key: string]: string } = {
  tempDirSize: i18n.t("admin.maintenance.storage.title-temporary-directory") as string,
  backupsDirSize: i18n.t("admin.maintenance.storage.title-backups-directory") as string,
  groupsDirSize: i18n.t("admin.maintenance.storage.title-groups-directory") as string,
  recipesDirSize: i18n.t("admin.maintenance.storage.title-recipes-directory") as string,
  userDirSize: i18n.t("admin.maintenance.storage.title-user-directory") as string,
};

function storageDetailsText(key: string) {
  return storageTitles[key] ?? i18n.t("about.unknown-version");
}

const storageDetails = ref<MaintenanceStorageDetails | null>(null);

async function openDetails() {
  if (state.storageDetailsLoading) return;
  state.storageDetailsLoading = true;
  state.storageDetails = true;
  try {
    const { data } = await adminApi.maintenance.getStorageDetails();
    if (data) {
      storageDetails.value = data;
    }
  }
  finally {
    state.storageDetailsLoading = false;
  }
}
// ==========================================================================
// Actions

async function handleCleanDirectories() {
  state.actionLoading = true;
  await adminApi.maintenance.cleanRecipeFolders();
  state.actionLoading = false;
}

async function handleCleanImages() {
  state.actionLoading = true;
  await adminApi.maintenance.cleanImages();
  state.actionLoading = false;
}

async function handleCleanTemp() {
  state.actionLoading = true;
  await adminApi.maintenance.cleanTemp();
  state.actionLoading = false;
}

const actions = [
  {
    name: i18n.t("admin.maintenance.action-clean-directories-name"),
    handler: handleCleanDirectories,
    subtitle: i18n.t("admin.maintenance.action-clean-directories-description"),
  },
  {
    name: i18n.t("admin.maintenance.action-clean-temporary-files-name"),
    handler: handleCleanTemp,
    subtitle: i18n.t("admin.maintenance.action-clean-temporary-files-description"),
  },
  {
    name: i18n.t("admin.maintenance.action-clean-images-name"),
    handler: handleCleanImages,
    subtitle: i18n.t("admin.maintenance.action-clean-images-description"),
  },
];
</script>

<style scoped>
.wrap-word {
  white-space: normal;
  word-wrap: break-word;
}
.maintenance-summary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.maintenance-summary {
  border-radius: 14px;
}
.maintenance-summary :deep(.v-list-item-title) {
  white-space: normal;
  font-size: 15px;
  line-height: 1.5;
}
.maintenance-action-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}
.maintenance-action-card {
  padding: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-separator), 0.5);
  border-radius: 14px;
}
.maintenance-action-card h3 {
  margin: 0 0 8px;
  font: 600 16px var(--bistro-body);
}
.maintenance-action-card p {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(var(--v-theme-text-secondary), var(--v-secondary-label-opacity));
}
.maintenance-action-card .v-btn,
.maintenance-summary-actions :deep(.v-btn) {
  min-height: 44px;
  height: auto;
  padding-block: 10px;
  border-radius: 10px;
  text-transform: none;
  letter-spacing: normal;
}
.maintenance-action-card :deep(.v-btn__content) {
  white-space: normal;
}
@media (max-width: 599px) {
  .maintenance-action-card .v-btn {
    width: 100%;
  }
}
</style>
