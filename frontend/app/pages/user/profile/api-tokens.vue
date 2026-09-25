<template>
  <v-container class="narrow-container">
    <BasePageTitle divider>
      <template #header>
        <v-img width="100%" max-height="200px" max-width="200px" src="/svgs/manage-api-tokens.svg" />
      </template>
      <template #title>
        {{ $t("settings.token.api-tokens") }}
      </template>
      {{ $t('settings.token.you-have-token-count', user.tokens!.length) }}
    </BasePageTitle>
    <section class="d-flex justify-center">
      <v-card class="mt-4 pa-4" width="100%" flat>
        <v-card-title class="px-0">
          {{ $t("settings.token.create-an-api-token") }}
        </v-card-title>
        <v-card-text class="px-0">
          <v-form ref="domNewTokenForm" @submit.prevent>
            <v-text-field v-model="name" :label="$t('settings.token.token-name')" variant="solo" flat
              density="comfortable" hide-details class="token-input" />
          </v-form>

          <template v-if="createdToken != ''">
            <v-textarea v-model="createdToken" class="mb-0 pb-0 token-input" :label="$t('settings.token.api-token')"
              readonly rows="3" variant="solo" flat density="comfortable" />
            <p>
              {{
                $t(
                  "settings.token.copy-this-token-for-use-with-an-external-application-this-token-will-not-be-viewable-again",
                )
              }}
            </p>
          </template>
        </v-card-text>
        <v-card-actions class="px-0">
          <BaseButton v-if="createdToken" cancel @click="resetCreate()">
            {{ $t('general.close') }}
          </BaseButton>
          <v-spacer />
          <AppButtonCopy v-if="createdToken" :icon="false" color="info" :copy-text="createdToken" />
          <BaseButton v-else key="generate-button" :disabled="name == ''" @click="createToken(name)">
            {{ $t('settings.token.generate') }}
          </BaseButton>
        </v-card-actions>
      </v-card>
    </section>
    <BaseDialog v-model="deleteDialog" :title="$t('general.confirm')" :icon="$globals.icons.alertCircle" color="error"
      can-confirm @confirm="deleteSelectedToken()">
      <v-card-text>
        {{ $t('general.confirm-delete-generic') }}
      </v-card-text>
    </BaseDialog>
    <BaseCardSectionTitle class="mt-10" :title="$t('settings.token.active-tokens')" />
    <section class="d-flex flex-column">
      <v-alert v-if="!tokenList.length" type="info" variant="tonal" class="mt-2">
        {{ $t('settings.token.you-have-token-count', 0) }}
      </v-alert>
      <v-list v-else>
        <div v-for="(token, index) in tokenList" :key="index">
          <v-list-item>
            <v-list-item-title>
              {{ token.name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ $t('general.created-on-date', [$d(new Date(token.createdAt!))]) }}
            </v-list-item-subtitle>
            <template #append>
              <v-btn icon variant="text" color="error" size="large" class="token-delete-btn"
                @click="openDeleteDialog(token.id)">
                <v-icon>{{ $globals.icons.delete }}</v-icon>
              </v-btn>
            </template>
          </v-list-item>
          <v-divider class="mx-2 my-2" />
        </div>
      </v-list>
    </section>
  </v-container>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import type { VForm } from "~/types/auto-forms";

definePageMeta({
  middleware: ["advanced-only"],
});

const i18n = useI18n();
const auth = useMealieAuth();

useSeoMeta({
  title: i18n.t("settings.token.api-tokens"),
});

const user = computed(() => {
  return auth.user.value;
});
const tokenList = computed(() => user.value?.tokens ?? []);

const api = useUserApi();

const domNewTokenForm = ref<VForm | null>(null);

const deleteDialog = ref(false);
const tokenToDelete = ref<number | null>(null);
const createdToken = ref("");
const name = ref("");
const loading = ref(false);

function resetCreate() {
  createdToken.value = "";
  loading.value = false;
  name.value = "";
  auth.getSession();
}

async function createToken(name: string) {
  if (loading.value) {
    resetCreate();
    return;
  }

  loading.value = true;

  if (!domNewTokenForm?.value?.validate()) {
    return;
  }

  const { data } = await api.users.createAPIToken({ name });

  if (data) {
    createdToken.value = data.token;
  }
}

function openDeleteDialog(id: number) {
  tokenToDelete.value = id;
  deleteDialog.value = true;
}

async function deleteSelectedToken() {
  if (tokenToDelete.value == null) {
    return;
  }

  const id = tokenToDelete.value;
  tokenToDelete.value = null;
  deleteDialog.value = false;

  const { data } = await api.users.deleteAPIToken(id);
  auth.getSession();
  return data;
}
</script>

<style scoped>
.token-input :deep(.v-field) {
  background: rgba(var(--v-theme-surface), 0.72) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.5);
  border-radius: 10px;
  box-shadow: none !important;
}

.token-input :deep(.v-field__outline) {
  display: none;
}

.token-input :deep(.v-field__input) {
  color: rgb(var(--v-theme-on-surface));
}

.token-delete-btn {
  min-width: 48px;
  width: 48px;
  height: 48px;
}
</style>
