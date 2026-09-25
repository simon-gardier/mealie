<template>
  <v-container class="narrow-container">
    <BasePageTitle divider>
      <template #header>
        <div class="d-flex flex-column align-center justify-center">
          <UserAvatarPicker :user-id="userCopy.id!" @uploaded="auth.getSession()" />
        </div>
      </template>
      <template #title>
        {{ $t("profile.user-settings") }}
      </template>
    </BasePageTitle>

    <section class="mt-5">
      <ToggleState tag="article">
        <template #activator="{ toggle, modelValue: toggleState }">
          <div class="d-flex justify-center">
            <v-btn v-if="!toggleState && $appInfo.allowPasswordLogin" color="info" class="mt-2 mb-n3" @click="toggle">
              <v-icon start>
                {{ $globals.icons.lock }}
              </v-icon>
              {{ $t("settings.change-password") }}
            </v-btn>
            <v-btn v-else-if="$appInfo.allowPasswordLogin" color="info" class="mt-2 mb-n3" @click="toggle">
              <v-icon start>
                {{ $globals.icons.user }}
              </v-icon>
              {{ $t("settings.profile") }}
            </v-btn>
          </div>
        </template>
        <template #default="{ modelValue: toggleState }">
          <v-slide-x-transition leave-absolute hide-on-leave>
            <div v-if="!toggleState" key="personal-info">
              <v-card tag="article" color="surface-variant" variant="flat" class="settings-card mt-10">
                <v-card-title class="settings-card-title">
                  {{ $t('profile.personal-information') }}
                </v-card-title>
                <v-card-text class="pb-0">
                  <v-form ref="userUpdate">
                    <v-text-field v-model="userCopy.username" :label="$t('user.username')" required validate-on="blur"
                      density="comfortable" variant="solo" class="settings-input" />
                    <v-text-field v-model="userCopy.fullName" :label="$t('user.full-name')" required validate-on="blur"
                      density="comfortable" variant="solo" class="settings-input" />
                    <v-text-field v-model="userCopy.email" :label="$t('user.email')" validate-on="blur" required
                      density="comfortable" variant="solo" class="settings-input" />
                  </v-form>
                </v-card-text>
                <v-card-actions class="justify-center">
                  <BaseButton update @click="updateUser" />
                </v-card-actions>
              </v-card>
            </div>
            <div v-else key="change-password">
              <v-card color="surface-variant" variant="flat" class="settings-card mt-10">
                <v-card-title class="settings-card-title">
                  {{ $t('settings.change-password') }}
                </v-card-title>
                <v-card-text class="pb-0">
                  <v-form ref="passChange">
                    <v-text-field v-model="password.current" :prepend-icon="$globals.icons.lock"
                      :label="$t('user.current-password')" validate-on="blur" :type="showPassword ? 'text' : 'password'"
                      :append-icon="showPassword ? $globals.icons.eye : $globals.icons.eyeOff"
                      :rules="[validators.minLength(1)]" density="comfortable" variant="solo" class="settings-input"
                      @click:append="showPassword = !showPassword" />
                    <v-text-field v-model="password.newOne" :prepend-icon="$globals.icons.lock"
                      :label="$t('user.new-password')" :type="showPassword ? 'text' : 'password'"
                      :append-icon="showPassword ? $globals.icons.eye : $globals.icons.eyeOff"
                      :rules="[validators.minLength(8)]" density="comfortable" variant="solo" class="settings-input"
                      @click:append="showPassword = !showPassword" />
                    <v-text-field v-model="password.newTwo" :prepend-icon="$globals.icons.lock"
                      :label="$t('user.confirm-password')"
                      :rules="[password.newOne === password.newTwo || $t('user.password-must-match')]"
                      validate-on="blur" :type="showPassword ? 'text' : 'password'"
                      :append-icon="showPassword ? $globals.icons.eye : $globals.icons.eyeOff" density="comfortable"
                      variant="solo" class="settings-input" @click:append="showPassword = !showPassword" />
                    <UserPasswordStrength v-model="password.newOne" />
                  </v-form>
                </v-card-text>
                <v-card-actions class="justify-center">
                  <BaseButton update :disabled="!passwordsMatch || password.current.length < 0"
                    @click="updatePassword" />
                </v-card-actions>
              </v-card>
            </div>
          </v-slide-x-transition>
        </template>
      </ToggleState>
    </section>
    <section>
      <v-card color="surface-variant" variant="flat" class="settings-card mt-10">
        <v-card-title class="settings-card-title">
          {{ $t('profile.preferences') }}
        </v-card-title>
        <v-card-text>
          <v-combobox v-model="selectedDefaultActivity" :label="$t('user.default-activity')" :items="activityOptions"
            :hint="$t('user.default-activity-hint')" density="comfortable" variant="solo" class="settings-input"
            validate-on="blur" persistent-hint />
          <v-checkbox v-model="userCopy.showAnnouncements" hide-details
            :label="$t('announcements.show-announcements-from-mealie')" color="primary" @change="updateUser" />
          <v-checkbox v-model="userCopy.advanced" hide-details :label="$t('profile.show-advanced-description')"
            color="primary" @change="updateUser" />
        </v-card-text>
      </v-card>
      <nuxt-link class="mt-5 d-flex flex-column justify-center text-center text-primary" :to="`/group`"> {{
        $t('profile.looking-for-privacy-settings') }} </nuxt-link>
      <div class="d-flex flex-wrap justify-center mt-5">
        <v-btn variant="outlined" class="rounded-xl my-1 mx-1" :to="`/user/profile`" nuxt exact>
          <v-icon start>
            {{ $globals.icons.backArrow }}
          </v-icon>
          {{ $t('profile.back-to-profile') }}
        </v-btn>
      </div>
    </section>
  </v-container>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import UserAvatarPicker from "~/components/Domain/User/UserAvatarPicker.vue";
import UserPasswordStrength from "~/components/Domain/User/UserPasswordStrength.vue";
import { validators } from "~/composables/use-validators";
import { useUserActivityPreferences } from "~/composables/use-users/preferences";
import useDefaultActivity from "~/composables/use-default-activity";
import { ActivityKey } from "~/lib/api/types/activity";
import type { UserBase } from "~/lib/api/types/user";

const i18n = useI18n();
const auth = useMealieAuth();
const { getDefaultActivityLabels, getActivityLabel, getActivityKey } = useDefaultActivity();
const user = computed(() => auth.user.value);

useSeoMeta({
  title: i18n.t("settings.profile"),
});

const activityPreferences = useUserActivityPreferences();
const activityOptions = getDefaultActivityLabels(i18n);
const selectedDefaultActivity = ref(getActivityLabel(i18n, activityPreferences.value.defaultActivity));
watch(selectedDefaultActivity, () => {
  activityPreferences.value.defaultActivity = getActivityKey(i18n, selectedDefaultActivity.value) ?? ActivityKey.RECIPES;
});

const userCopy = ref({ ...user.value });
watch(user, () => {
  userCopy.value = { ...user.value };
});

const api = useUserApi();
const showPassword = ref(false);
const password = reactive({
  current: "",
  newOne: "",
  newTwo: "",
});

const passwordsMatch = computed(() => password.newOne === password.newTwo && password.newOne.length > 0);

async function updateUser() {
  const userData = userCopy.value;
  if (!userData?.id || !userData.email) return;

  const updatePayload: UserBase = {
    id: userData.id,
    username: userData.username,
    fullName: userData.fullName,
    email: userData.email,
    authMethod: userData.authMethod,
    admin: userData.admin,
    group: userData.group,
    household: userData.household,
    showAnnouncements: userData.showAnnouncements,
    advanced: userData.advanced,
    canInvite: userData.canInvite,
    canManage: userData.canManage,
    canManageHousehold: userData.canManageHousehold,
    canOrganize: userData.canOrganize,
  };

  const { response } = await api.users.updateOne(userData.id, updatePayload);
  if (response?.status === 200) {
    auth.getSession();
  }
}

async function updatePassword() {
  if (!userCopy.value?.id) {
    return;
  }
  const { response } = await api.users.changePassword({
    currentPassword: password.current,
    newPassword: password.newOne,
  });

  if (response?.status === 200) {
    // The new password invalidates this session server-side, so end it here rather than letting the
    // next request fail its way to the login page.
    await auth.signOut();
  }
}
</script>

<style scoped>
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

.settings-card :deep(.v-card-text) {
  padding-top: 0.75rem;
}

.settings-input {
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
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

.settings-input :deep(.v-field__input) {
  color: rgb(var(--v-theme-on-surface));
}

.settings-input :deep(.v-field--focused .v-field__outline) {
  display: none;
}
</style>
