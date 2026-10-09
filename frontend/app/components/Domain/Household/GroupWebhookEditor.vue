<template>
  <div>
    <v-card-text class="webhook-fields">
      <v-switch
        v-model="webhookCopy.enabled"
        color="primary"
        hide-details
        :label="$t('general.enabled')"
      />
      <v-text-field
        v-model="webhookCopy.name"
        :label="$t('settings.webhooks.webhook-name')"
        variant="filled"
        density="comfortable"
      />
      <v-text-field
        v-model="webhookCopy.url"
        :label="$t('settings.webhooks.webhook-url')"
        variant="filled"
        density="comfortable"
      />
      <v-menu v-model="timeMenu" :close-on-content-click="false" location="bottom" max-width="320">
        <template #activator="{ props: menuProps }">
          <v-text-field
            v-bind="menuProps"
            :model-value="scheduledTime"
            :label="$t('settings.webhooks.scheduled-time')"
            readonly
            variant="filled"
            density="comfortable"
          />
        </template>
        <v-card class="webhook-time-picker pa-4">
          <div class="webhook-time-fields">
            <v-select v-model="selectedHour" :items="hours" :label="$t('settings.webhooks.hours')" hide-details />
            <v-select v-model="selectedMinute" :items="minutes" :label="$t('settings.webhooks.minutes')" hide-details />
          </div>
          <v-btn class="mt-3" variant="tonal" color="primary" block @click="timeMenu = false">
            {{ $t('general.confirm') }}
          </v-btn>
        </v-card>
      </v-menu>
    </v-card-text>
    <v-card-actions class="webhook-actions">
      <v-btn variant="text" color="error" :prepend-icon="$globals.icons.delete" @click="$emit('delete', webhookCopy.id)">
        {{ $t('general.delete') }}
      </v-btn>
      <v-btn variant="tonal" color="primary" :prepend-icon="$globals.icons.testTube" @click="$emit('test', webhookCopy.id)">
        {{ $t('general.test') }}
      </v-btn>
      <v-btn variant="tonal" color="primary" :prepend-icon="$globals.icons.save" @click="handleSave">
        {{ $t('general.save') }}
      </v-btn>
    </v-card-actions>
  </div>
</template>

<script setup lang="ts">
import type { ReadWebhook } from "~/lib/api/types/household";
import { timeLocalToUTC, timeUTCToLocal } from "~/composables/use-group-webhooks";

const props = defineProps<{
  webhook: ReadWebhook;
}>();

const emit = defineEmits<{
  delete: [id: string];
  save: [webhook: ReadWebhook];
  test: [id: string];
}>();

const i18n = useI18n();
const itemUTC = ref<string>(props.webhook.scheduledTime);
const itemLocal = ref<string>(timeUTCToLocal(props.webhook.scheduledTime));

const scheduledTime = computed({
  get() {
    return itemLocal.value;
  },
  set(v: string) {
    itemUTC.value = timeLocalToUTC(v);
    itemLocal.value = v;
  },
});

const timeMenu = ref(false);
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const selectedHour = computed({
  get: () => scheduledTime.value.split(":")[0],
  set: (value) => { scheduledTime.value = `${value}:${selectedMinute.value}`; },
});
const selectedMinute = computed({
  get: () => scheduledTime.value.split(":")[1],
  set: (value) => { scheduledTime.value = `${selectedHour.value}:${value}`; },
});
const webhookCopy = ref({ ...props.webhook });

function handleSave() {
  webhookCopy.value.scheduledTime = itemLocal.value;
  emit("save", webhookCopy.value);
}

// Set page title using useSeoMeta
useSeoMeta({
  title: i18n.t("settings.webhooks.webhooks"),
});
</script>

<style scoped>
.webhook-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
}
.webhook-fields :deep(.v-field) {
  border-radius: 10px;
}
.webhook-fields :deep(input) {
  font: 400 16px var(--bistro-body);
}
.webhook-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 0 0;
}
.webhook-time-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.webhook-actions .v-btn {
  flex: 1 0 auto;
  min-width: max-content;
  padding-inline: 8px;
  min-height: 44px;
  border-radius: 10px;
  font-size: 14px;
  text-transform: none;
  letter-spacing: normal;
}
.webhook-actions .v-btn:first-child {
  margin-right: 0;
}
.webhook-actions :deep(.v-btn__content) {
  white-space: nowrap;
}
</style>
