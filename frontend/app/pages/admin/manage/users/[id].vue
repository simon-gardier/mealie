<template>
  <v-container v-if="user" class="narrow-container">
    <BasePageTitle>
      <template #header>
        <v-img width="100%" max-height="125" max-width="125" src="/svgs/manage-profile.svg" />
      </template>
      <template #title>
        {{ $t("user.admin-user-management") }}
      </template>
      {{ $t("user.changes-reflected-immediately") }}
    </BasePageTitle>
    <AppToolbar back />
    <v-form v-if="!userError" ref="refNewUserForm" @submit.prevent="handleSubmit">
      <v-card variant="outlined" class="admin-content-card" style="border-color: rgb(var(--v-theme-separator));">
        <v-sheet color="transparent" class="user-edit-sheet">
          <v-card-text>
            <div class="user-identifier">
              <p> {{ $t("user.user-id-with-value", { id: user.id }) }}</p>
            </div>
            <!-- This is disabled since we can't properly handle changing the user's group in most scenarios -->

            <v-row>
              <v-col cols="12" sm="6">
                <v-select
                  v-if="groups"
                  v-model="user.group"
                  disabled
                  :items="groups"
                  variant="filled"
                  flat
                  item-title="name"
                  item-value="name"
                  :return-object="false"
                  :label="$t('group.user-group')"
                  :rules="[validators.required]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-if="households"
                  v-model="user.household"
                  :items="households"
                  variant="filled"
                  flat
                  item-title="name"
                  item-value="name"
                  :return-object="false"
                  :label="$t('household.user-household')"
                  :rules="[validators.required]"
                />
              </v-col>
            </v-row>
            <div class="user-reset-action">
              <BaseButton
                variant="tonal"
                color="primary"
                class="reset-link-button"
                type="button"
                :loading="generatingToken"
                create
                @click.prevent="handlePasswordReset"
              >
                {{ $t("user.generate-password-reset-link") }}
              </BaseButton>
            </div>

            <div v-if="resetUrl" class="user-reset-result">
              <v-card-text>
                <p class="text-center pb-0">
                  {{ resetUrl }}
                </p>
              </v-card-text>
              <v-card-actions class="align-center pt-0" style="gap: 4px">
                <BaseButton cancel @click="resetUrl = ''">
                  {{ $t("general.close") }}
                </BaseButton>
                <v-spacer />
                <BaseButton v-if="user.email" color="info" class="mr-1" @click="sendResetEmail">
                  <template #icon>
                    {{ $globals.icons.email }}
                  </template>
                  {{ $t("user.email") }}
                </BaseButton>
                <AppButtonCopy :icon="false" color="info" :copy-text="resetUrl" />
              </v-card-actions>
            </div>

            <AutoForm
              v-model="user"
              :items="editFields"
              variant="filled"
              class="user-edit-fields"
              update-mode
              :disabled-fields="disabledFields"
            />
          </v-card-text>
        </v-sheet>
      </v-card>
      <div class="d-flex pa-2">
        <BaseButton type="submit" edit class="ml-auto">
          {{ $t("general.update") }}
        </BaseButton>
      </div>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { useAdminApi, useUserApi } from "~/composables/api";
import { useGroups } from "~/composables/use-groups";
import { useAdminHouseholds } from "~/composables/use-households";
import { alert } from "~/composables/use-toast";
import { useUserForm } from "~/composables/use-users";
import { validators } from "~/composables/use-validators";
import type { UserOut } from "~/lib/api/types/user";

definePageMeta({
  layout: "admin",
});

const { userForm } = useUserForm();
const editFields = userForm.map(field => ({ ...field, cols: 12 }));
const { groups } = useGroups();
const { useHouseholdsInGroup } = useAdminHouseholds();
const i18n = useI18n();
const route = useRoute();

const userId = route.params.id as string;

// ==============================================
// New User Form

const refNewUserForm = ref<VForm | null>(null);

const adminApi = useAdminApi();

const user = ref<UserOut | null>(null);
const households = useHouseholdsInGroup(computed(() => user.value?.groupId || ""));

const disabledFields = computed(() => {
  return user.value?.authMethod !== "Mealie" ? ["admin"] : [];
});

const userError = ref(false);

const resetUrl = ref<string | null>(null);
const generatingToken = ref(false);

onMounted(async () => {
  const { data, error } = await adminApi.users.getOne(userId);

  if (error?.response?.status === 404) {
    alert.error(i18n.t("user.user-not-found"));
    userError.value = true;
  }

  if (data) {
    user.value = data;
  }
});

async function handleSubmit() {
  if (!refNewUserForm.value?.validate() || user.value === null) return;

  const { response, data } = await adminApi.users.updateOne(user.value.id, user.value);

  if (response?.status === 200 && data) {
    user.value = data;
  }
}

async function handlePasswordReset() {
  if (user.value === null) return;
  generatingToken.value = true;

  const { response, data } = await adminApi.users.generatePasswordResetToken({ email: user.value.email });

  if (response?.status === 201 && data) {
    const token: string = data.token;
    resetUrl.value = `${window.location.origin}/reset-password/?token=${token}`;
  }

  generatingToken.value = false;
}

const userApi = useUserApi();
async function sendResetEmail() {
  if (!user.value?.email) return;
  const { response } = await userApi.email.sendForgotPassword({ email: user.value.email });
  if (response && response.status === 200) {
    alert.success(i18n.t("profile.email-sent"));
  }
  else {
    alert.error(i18n.t("profile.error-sending-email"));
  }
}
</script>

<style scoped>
.user-identifier {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(var(--v-theme-separator), 0.5);
  font-size: 13px;
  line-height: 1.5;
  color: rgba(var(--v-theme-text-secondary), var(--v-secondary-label-opacity));
  overflow-wrap: anywhere;
}
.user-reset-action {
  margin: 12px 0 24px;
}
.reset-link-button {
  max-width: 100%;
  min-height: 44px;
  height: auto;
  padding: 10px 16px;
  border-radius: 10px;
  text-transform: none;
}
.reset-link-button :deep(.v-btn__content) {
  white-space: normal;
}
.user-reset-result {
  margin-bottom: 24px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-fill), 0.5);
  overflow-wrap: anywhere;
}
.user-reset-result :deep(.v-card-actions) {
  flex-wrap: wrap;
}
.user-edit-fields :deep(.v-card) {
  border: 0 !important;
  border-style: none !important;
  outline: none !important;
  border-radius: 0 !important;
  background: transparent !important;
  padding: 0;
  box-shadow: none !important;
}
.user-edit-fields :deep(.v-col) {
  padding-inline: 0 !important;
}
.user-edit-fields :deep(.v-row > .v-col:first-child > .v-divider) {
  display: none;
}
.user-edit-fields :deep(.v-divider) {
  display: none;
}
.user-edit-fields :deep(.v-checkbox) {
  padding: 8px 12px;
  margin-bottom: 8px;
  background: rgba(var(--v-theme-fill), 0.5);
  border-radius: 10px;
}
.user-edit-fields :deep(.v-checkbox .v-label) {
  white-space: normal;
  font-size: 15px;
  line-height: 1.5;
  color: rgb(var(--v-theme-on-surface));
  opacity: 1;
}
</style>
