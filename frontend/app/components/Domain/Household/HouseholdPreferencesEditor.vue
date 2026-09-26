<template>
  <div v-if="preferences" class="household-preferences-editor">
    <v-card class="settings-card mb-6" color="surface-variant" variant="flat">
      <v-card-title class="settings-card-title">
        {{ $t('household.household-preferences') }}
      </v-card-title>
      <v-card-text class="settings-card-body">
        <div class="mb-6">
          <v-checkbox v-model="local.privateHousehold" hide-details density="compact"
            :label="$t('household.private-household')" color="primary" class="settings-option" />
          <div class="ml-8">
            <p class="text-subtitle-2 my-0 py-0">
              {{ $t("household.private-household-description") }}
            </p>
            <DocLink class="mt-2" link="/documentation/getting-started/faq/#how-do-private-groups-and-recipes-work" />
          </div>
        </div>
        <div class="mb-6">
          <v-checkbox v-model="local.lockRecipeEditsFromOtherHouseholds" hide-details density="compact"
            :label="$t('household.lock-recipe-edits-from-other-households')" color="primary" class="settings-option" />
          <div class="ml-8">
            <p class="text-subtitle-2 my-0 py-0">
              {{ $t("household.lock-recipe-edits-from-other-households-description") }}
            </p>
          </div>
        </div>
        <div class="mb-6">
          <v-checkbox v-model="local.showAnnouncements" hide-details density="compact" color="primary"
            class="settings-option" :label="$t('announcements.show-announcements-from-mealie')" />
          <div class="ml-8">
            <p class="text-subtitle-2 my-0 py-0">
              {{ $t("announcements.show-announcements-setting-description") }}
            </p>
          </div>
        </div>
        <v-select v-model="local.firstDayOfWeek" :prepend-icon="$globals.icons.calendarWeekBegin" :items="allDays"
          item-title="name" item-value="value" :label="$t('settings.first-day-of-week')" variant="solo" flat
          density="comfortable" class="settings-input" />
      </v-card-text>
    </v-card>

    <v-card class="settings-card" color="surface-variant" variant="flat">
      <v-card-title class="settings-card-title">
        {{ $t('household.household-recipe-preferences') }}
      </v-card-title>
      <v-card-text class="settings-card-body">
        <p class="mb-4 text-subtitle-2">
          {{ $t("household.default-recipe-preferences-description") }}
        </p>
        <div class="preference-container">
          <div v-for="p in recipePreferences" :key="p.key">
            <v-checkbox v-model="local[p.key]" hide-details density="compact" :label="p.label" color="primary"
              class="settings-option" />
            <p class="ml-8 text-subtitle-2 my-0 py-0">
              {{ p.description }}
            </p>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import type { ReadHouseholdPreferences } from "~/lib/api/types/household";

const preferences = defineModel<ReadHouseholdPreferences>({ required: true });
const local = reactive({ ...preferences.value });
watch(local, (newVal) => { preferences.value = { ...newVal }; });
watch(preferences, (newVal) => { if (newVal) Object.assign(local, newVal); });

const i18n = useI18n();

type Preference = {
  key: keyof ReadHouseholdPreferences;
  label: string;
  description: string;
};

const recipePreferences: Preference[] = [
  {
    key: "recipePublic",
    label: i18n.t("group.allow-users-outside-of-your-group-to-see-your-recipes"),
    description: i18n.t("group.allow-users-outside-of-your-group-to-see-your-recipes-description"),
  },
  {
    key: "recipeShowNutrition",
    label: i18n.t("group.show-nutrition-information"),
    description: i18n.t("group.show-nutrition-information-description"),
  },
  {
    key: "recipeShowAssets",
    label: i18n.t("group.show-recipe-assets"),
    description: i18n.t("group.show-recipe-assets-description"),
  },
  {
    key: "recipeLandscapeView",
    label: i18n.t("group.default-to-landscape-view"),
    description: i18n.t("group.default-to-landscape-view-description"),
  },
  {
    key: "recipeDisableComments",
    label: i18n.t("group.disable-users-from-commenting-on-recipes"),
    description: i18n.t("group.disable-users-from-commenting-on-recipes-description"),
  },
];

const allDays = [
  {
    name: i18n.t("general.sunday"),
    value: 0,
  },
  {
    name: i18n.t("general.monday"),
    value: 1,
  },
  {
    name: i18n.t("general.tuesday"),
    value: 2,
  },
  {
    name: i18n.t("general.wednesday"),
    value: 3,
  },
  {
    name: i18n.t("general.thursday"),
    value: 4,
  },
  {
    name: i18n.t("general.friday"),
    value: 5,
  },
  {
    name: i18n.t("general.saturday"),
    value: 6,
  },
];
</script>

<style lang="css">
.settings-card {
  border: 1px solid rgb(var(--v-theme-primary));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface-variant));
  overflow: hidden;
}

.settings-card-title {
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.35);
  background: rgba(var(--v-theme-primary), 0.08);
  padding: 0.9rem 1rem 0.8rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.settings-card-body {
  padding-top: 0.8rem;
}

.settings-option {
  margin-top: 0.15rem;
}

.settings-input {
  margin-top: 0.25rem;
}

.settings-input :deep(.v-field) {
  background: rgba(var(--v-theme-surface), 0.72) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.5);
  border-radius: 10px;
  box-shadow: none !important;
}

.settings-input :deep(.v-field__outline) {
  display: none;
}

.preference-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 600px;
}
</style>
