<template>
  <v-container class="narrow-container">
    <BasePageTitle class="mb-2">
      <template #header>
        <v-img width="100%" max-height="125" max-width="125" src="/svgs/manage-profile.svg" />
      </template>
      <template #title>
        {{ $t('user.admin-user-creation') }}
      </template>
    </BasePageTitle>
    <AppToolbar back />
    <v-form ref="refNewUserForm" @submit.prevent="handleSubmit">
      <v-card variant="outlined" class="admin-content-card">
        <v-card-text>
          <v-sheet color="transparent" class="user-membership-fields">
            <v-row>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="selectedGroup"
                  :items="groups || []"
                  item-title="name"
                  return-object
                  variant="filled"
                  :label="$t('group.user-group')"
                  :rules="[validators.required]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="newUserData.household"
                  :disabled="!selectedGroup"
                  :items="households"
                  item-title="name"
                  item-value="name"
                  variant="filled"
                  :label="$t('household.user-household')"
                  :hint="selectedGroup ? '' : $t('group.you-must-select-a-group-before-selecting-a-household')"
                  persistent-hint
                  :rules="[validators.required]"
                />
              </v-col>
            </v-row>
          </v-sheet>
          <h2 class="user-form-heading">
            {{ $t('user.user-details') }}
          </h2>
          <AutoForm v-model="newUserData" :items="detailFields" variant="filled" class="user-details-fields" />
          <h2 class="user-form-heading">
            {{ $t('user.permissions') }}
          </h2>
          <div class="user-permission-list">
            <v-checkbox
              v-for="permission in permissionFields"
              :key="permission.varName"
              v-model="newUserData[permission.varName as PermissionName]"
              :label="permission.label"
              hide-details
              color="primary"
              density="comfortable"
            />
          </div>
        </v-card-text>
      </v-card>
      <div class="d-flex pa-2">
        <BaseButton type="submit" class="ml-auto" />
      </div>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { useAdminApi } from "~/composables/api";
import { useGroups } from "~/composables/use-groups";
import { useUserForm } from "~/composables/use-users";
import { validators } from "~/composables/use-validators";
import type { GroupInDB, UserIn } from "~/lib/api/types/user";
import type { VForm } from "~/types/auto-forms";

definePageMeta({
  layout: "admin",
});
const { userForm } = useUserForm();
type PermissionName = "admin" | "canInvite" | "canManage" | "canOrganize" | "canManageHousehold" | "advanced";
const permissionNames = new Set(["admin", "canInvite", "canManage", "canOrganize", "canManageHousehold", "advanced"]);
const detailFields = userForm.filter(field => !permissionNames.has(field.varName)).map(field => ({ ...field, section: undefined, cols: 12 }));
const permissionFields = userForm.filter(field => permissionNames.has(field.varName));
const { groups } = useGroups();
const router = useRouter();

const refNewUserForm = ref<VForm | null>(null);
const adminApi = useAdminApi();

const selectedGroup = ref<GroupInDB | undefined>(undefined);
const households = computed(() => selectedGroup.value?.households || []);

const newUserData = ref({
  username: "",
  fullName: "",
  email: "",
  admin: false,
  group: computed(() => selectedGroup.value?.name || ""),
  household: "",
  advanced: false,
  canInvite: false,
  canManage: false,
  canOrganize: false,
  canManageHousehold: false,
  password: "",
  authMethod: "Mealie",
});

async function handleSubmit() {
  const { valid } = (await refNewUserForm.value?.validate()) ?? {
    valid: false,
  };

  if (!valid) return;

  const { response } = await adminApi.users.createOne(
    newUserData.value as UserIn,
  );

  if (response?.status === 201) {
    router.push("/admin/manage/users");
  }
}
</script>

<style scoped>
.user-form-heading {
  margin: 24px 0 16px;
  font: 600 18px var(--bistro-body);
}
.user-details-fields :deep(.v-card) {
  background: transparent !important;
  border: 0;
  padding: 0;
  box-shadow: none;
}
.user-details-fields :deep(.v-col) {
  padding-inline: 0 !important;
}
.user-membership-fields :deep(.v-label) {
  white-space: normal;
}
.user-permission-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.user-permission-list > .v-input {
  padding: 8px 12px;
  background: rgba(var(--v-theme-fill), 0.5);
  border-radius: 10px;
}
.user-permission-list :deep(.v-label) {
  white-space: normal;
  font-size: 15px;
  line-height: 1.5;
  opacity: 1;
  color: rgb(var(--v-theme-on-surface));
}
</style>
