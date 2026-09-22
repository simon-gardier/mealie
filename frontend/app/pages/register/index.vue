<template>
  <v-container fill-height fluid class="d-flex justify-center align-center flex-column fill-height register-background">
    <img src="/welcome_title.png" alt="Petit Chef" class="welcome-title mb-4">
    <v-card class="d-flex flex-column w-100 glass-card" max-width="1200px" min-height="700px">
      <!-- Form Container -->
      <div class="d-flex justify-center grow items-center my-4">
        <template v-if="state.ctx.state === States.Initial">
          <v-container>
            <v-card-title class="text-h5 my-4 mb-5 pb-0 text-center section-title">
              {{ $t("user-registration.user-registration") }}
            </v-card-title>

            <div class="d-flex flex-wrap justify-center flex-md-nowrap pa-4" style="gap: 1em">
              <v-card color="primary" dark hover width="320px" @click="initial.joinGroup">
                <v-card-title class="d-flex align-center justify-center py-3">
                  <v-icon size="large" start>
                    {{ $globals.icons.group }}
                  </v-icon>
                  {{ $t("user-registration.join-a-group") }}
                </v-card-title>
              </v-card>
              <v-card color="primary" dark hover width="320px" @click="initial.createGroup">
                <v-card-title class="d-flex align-center justify-center py-3">
                  <v-icon size="large" start>
                    {{ $globals.icons.user }}
                  </v-icon>

                  {{ $t("user-registration.create-a-new-group") }}
                </v-card-title>
              </v-card>
            </div>
          </v-container>
        </template>

        <template v-else-if="state.ctx.state === States.ProvideToken">
          <div>
            <v-card-title class="text-h5 section-title">
              <v-icon size="large" class="mr-3">
                {{ $globals.icons.group }}
              </v-icon>
              <span> {{ $t("user-registration.join-a-group") }} </span>
            </v-card-title>
            <v-divider />
            <v-card-text>
              {{ $t("user-registration.provide-registration-token-description") }}
              <v-form ref="domTokenForm" class="mt-4" @submit.prevent>
                <v-text-field v-model="token" v-bind="inputAttrs" :label="$t('group.group-token')"
                  :rules="[validators.required]" />
              </v-form>
            </v-card-text>
            <v-divider />
            <v-card-actions class="mt-auto justify-space-between">
              <BaseButton class="registration-step-button" cancel @click="state.back">
                <template #icon>
                  {{ $globals.icons.back }}
                </template>
                {{ $t("general.back") }}
              </BaseButton>
              <BaseButton class="registration-step-button" icon-right @click="provideToken.next">
                <template #icon>
                  {{ $globals.icons.forward }}
                </template>
                {{ $t("general.next") }}
              </BaseButton>
            </v-card-actions>
          </div>
        </template>

        <template v-else-if="state.ctx.state === States.ProvideGroupDetails">
          <div class="preferred-width">
            <v-card-title class="text-h5 section-title">
              <v-icon size="large" class="mr-3">
                {{ $globals.icons.group }}
              </v-icon>
              <span> {{ $t("user-registration.group-details") }}</span>
            </v-card-title>
            <v-card-text>
              {{ $t("user-registration.group-details-description") }}
            </v-card-text>
            <v-divider />
            <v-card-text>
              <v-form ref="domGroupForm" v-model="isGroupFormValid" @submit.prevent>
                <v-text-field v-model="groupDetails.groupName.value" v-bind="inputAttrs" :label="$t('group.group-name')"
                  :rules="[validators.required]" :error-messages="groupErrorMessages" @blur="validGroupName" />
                <div class="mt-n4 px-2">
                  <v-checkbox v-model="groupDetails.groupPrivate.value" hide-details color="primary"
                    :label="$t('group.settings.keep-my-recipes-private')" />
                  <p class="text-caption mt-1">
                    {{ $t("group.settings.keep-my-recipes-private-description") }}
                  </p>
                  <v-checkbox v-model="groupDetails.groupSeed.value" hide-details color="primary"
                    :label="$t('data-pages.seed-data')" />
                  <p class="text-caption mt-1">
                    {{ $t("user-registration.use-seed-data-description") }}
                  </p>
                </div>
              </v-form>
            </v-card-text>
            <v-divider />
            <v-card-actions class="justify-space-between">
              <BaseButton class="registration-step-button" cancel @click="state.back">
                <template #icon>
                  {{ $globals.icons.back }}
                </template>
                {{ $t("general.back") }}
              </BaseButton>
              <BaseButton class="registration-step-button" icon-right :disabled="!isGroupFormValid || !groupNameValid"
                @click="groupDetails.next">
                <template #icon>
                  {{ $globals.icons.forward }}
                </template>
                {{ $t("general.next") }}
              </BaseButton>
            </v-card-actions>
          </div>
        </template>

        <template v-else-if="state.ctx.state === States.ProvideAccountDetails">
          <div>
            <UserRegistrationForm v-model="isAccountFormValid" />
            <v-divider />
            <v-card-actions class="justify-space-between">
              <BaseButton class="registration-step-button" cancel @click="state.back">
                <template #icon>
                  {{ $globals.icons.back }}
                </template>
                {{ $t("general.back") }}
              </BaseButton>
              <BaseButton class="registration-step-button" icon-right :disabled="!isAccountFormValid"
                @click="accountDetailsNext">
                <template #icon>
                  {{ $globals.icons.forward }}
                </template>
                {{ $t("general.next") }}
              </BaseButton>
            </v-card-actions>
          </div>
        </template>

        <template v-else-if="state.ctx.state === States.Confirmation">
          <div class="preferred-width">
            <v-card-title class="text-h5 mb-0 pb-0 section-title">
              <v-icon size="large" class="mr-3">
                {{ $globals.icons.user }}
              </v-icon>
              <span>{{ $t("general.confirm") }}</span>
            </v-card-title>
            <v-list>
              <template v-for="(item, idx) in confirmationData">
                <v-list-item v-if="item.display" :key="idx">
                  <v-list-item-title> {{ item.text }} </v-list-item-title>
                  <v-list-item-subtitle> {{ item.value }} </v-list-item-subtitle>
                </v-list-item>
                <v-divider v-if="idx !== confirmationData.length - 1" :key="`divider-${idx}`" />
              </template>
            </v-list>

            <v-divider />
            <v-card-actions class="justify-space-between">
              <BaseButton cancel @click="state.back">
                <template #icon>
                  {{ $globals.icons.back }}
                </template>
                {{ $t("general.back") }}
              </BaseButton>
              <BaseButton @click="submitRegistration">
                <template #icon>
                  {{ $globals.icons.check }}
                </template>
                {{ $t("general.submit") }}
              </BaseButton>
            </v-card-actions>
          </div>
        </template>
      </div>

      <v-card-actions class="justify-center flex-wrap py-8" style="gap: 0.5rem;">
        <BaseButton size="large" color="primary" :icon="$globals.icons.lock" to="/login">
          {{ $t("user.login") }}
        </BaseButton>
        <BaseButton size="large" color="primary" :icon="$globals.icons.translate" @click="langDialog = true">
          {{ $t("language-dialog.choose-language") }}
        </BaseButton>
      </v-card-actions>
    </v-card>
    <LanguageDialog v-model="langDialog" />
    <CinematicTransition ref="cinematicTransition" />
  </v-container>
</template>

<script setup lang="ts">
import { States, RegistrationType, useRegistration } from "./states";
import { useUserRegistrationForm } from "~/composables/use-users/user-registration-form";
import { useRouteQuery } from "~/composables/use-router";
import { validators, useAsyncValidator } from "~/composables/use-validators";
import { useUserApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";
import type { CreateUserRegistration } from "~/lib/api/types/user";
import { usePublicApi } from "~/composables/api/api-client";
import { useLocales } from "~/composables/use-locales";
import UserRegistrationForm from "~/components/Domain/User/UserRegistrationForm.vue";
import type { VForm } from "~/types/auto-forms";

definePageMeta({
  layout: "blank",
});

const inputAttrs = {
  variant: "underlined" as const,
  color: "primary",
  density: "comfortable" as const,
  validateOnBlur: true,
};

const i18n = useI18n();

const cinematicTransition = ref<{ play: (zoomOutScale?: number, zoomInScale?: number) => Promise<void> } | null>(null);

function safeValidate(form: Ref<VForm | null>) {
  if (form.value && form.value.validate) {
    return form.value.validate();
  }
  return false;
}

// Registration Context
const state = useRegistration();

// Handle Token URL / Initialization
const token = useRouteQuery("token");
function initialUser() {
  return false;
}
onMounted(() => {
  if (token.value) {
    state.setState(States.ProvideAccountDetails);
    state.setType(RegistrationType.JoinGroup);
  }
  if (initialUser()) {
    state.setState(States.ProvideGroupDetails);
    state.setType(RegistrationType.InitialGroup);
  }
});

// Initial
const initial = {
  createGroup: () => {
    state.setState(States.ProvideGroupDetails);
    state.setType(RegistrationType.CreateGroup);
    if (token.value != null) {
      token.value = null;
    }
  },
  joinGroup: () => {
    state.setState(States.ProvideToken);
    state.setType(RegistrationType.JoinGroup);
  },
};

// Provide Token
const domTokenForm = ref<VForm | null>(null);
function validateToken() {
  return true;
}
const provideToken = {
  next: () => {
    if (!safeValidate(domTokenForm as Ref<VForm>)) {
      return;
    }
    if (validateToken()) {
      state.setState(States.ProvideAccountDetails);
    }
  },
};

// Provide Group Details
const publicApi = usePublicApi();
const domGroupForm = ref<VForm | null>(null);
const isGroupFormValid = ref(false);
const groupName = ref("");
const groupSeed = ref(false);
const groupPrivate = ref(false);
const groupErrorMessages = ref<string[]>([]);
const { validate: validGroupName, valid: groupNameValid } = useAsyncValidator(
  groupName,
  (v: string) => publicApi.validators.group(v),
  i18n.t("validation.group-name-is-taken"),
  groupErrorMessages,
);
async function validateGroup() {
  if (!groupName.value || !groupName.value.trim()) {
    groupErrorMessages.value = [i18n.t("validation.required")];
    return false;
  }
  groupErrorMessages.value = [];
  await validGroupName();

  if (!groupNameValid.value) {
    return false;
  }

  return true;
}
const groupDetails = {
  groupName,
  groupSeed,
  groupPrivate,
  next: async () => {
    if (!await validateGroup()) {
      return;
    }
    state.setState(States.ProvideAccountDetails);
  },
};

const isAccountFormValid = ref(false);
const {
  accountDetails,
  credentials,

} = useUserRegistrationForm();
async function accountDetailsNext() {
  if (!await accountDetails.validate()) {
    return;
  }
  state.setState(States.Confirmation);
}

// Locale
const { locale } = useLocales();
const langDialog = ref(false);

// Confirmation
const confirmationData = computed(() => {
  return [
    {
      display: state.ctx.type === RegistrationType.CreateGroup,
      text: i18n.t("group.group"),
      value: groupName.value,
    },
    {
      display: state.ctx.type === RegistrationType.CreateGroup,
      text: i18n.t("data-pages.seed-data"),
      value: groupSeed.value ? i18n.t("general.yes") : i18n.t("general.no"),
    },
    {
      display: state.ctx.type === RegistrationType.CreateGroup,
      text: i18n.t("group.settings.keep-my-recipes-private"),
      value: groupPrivate.value ? i18n.t("general.yes") : i18n.t("general.no"),
    },
    {
      display: true,
      text: i18n.t("user.email"),
      value: accountDetails.email.value,
    },
    {
      display: true,
      text: i18n.t("user.full-name"),
      value: accountDetails.fullName.value,
    },
    {
      display: true,
      text: i18n.t("user.username"),
      value: accountDetails.username.value,
    },
    {
      display: true,
      text: i18n.t("user.enable-advanced-content"),
      value: accountDetails.advancedOptions.value ? i18n.t("general.yes") : i18n.t("general.no"),
    },
  ];
});

const api = useUserApi();
const router = useRouter();
async function submitRegistration() {
  const payload: CreateUserRegistration = {
    email: accountDetails.email.value,
    username: accountDetails.username.value,
    fullName: accountDetails.fullName.value,
    password: credentials.password1.value,
    passwordConfirm: credentials.password2.value,
    locale: locale.value,
    advanced: accountDetails.advancedOptions.value,
    profileImage: accountDetails.profileFile.value ? null : accountDetails.profileAvatar.value,
  };
  if (state.ctx.type === RegistrationType.CreateGroup) {
    payload.group = groupName.value;
    payload.private = groupPrivate.value;
    payload.seedData = groupSeed.value;
  }
  else {
    payload.groupToken = token.value;
  }
  const { response, error } = await api.register.register(payload);
  if (response?.status === 201) {
    const newUserId = response.data?.id;
    if (newUserId && accountDetails.profileFile.value) {
      const formData = new FormData();
      formData.append("profile", accountDetails.profileFile.value);
      await api.upload.file(`/api/users/${newUserId}/image`, formData);
    }

    accountDetails.reset();
    credentials.reset();
    alert.success(i18n.t("user-registration.registration-success"));
    await cinematicTransition.value?.play();
    router.push("/login");
  }
  // The Axios interceptor already shows detail.message errors.
  else if (!error?.response?.data?.detail?.message) {
    alert.error(i18n.t("events.something-went-wrong"));
  }
}
</script>

<style lang="css" scoped>
.register-background {
  background-image: url("/eifel_remy_wallpaper.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.glass-card {
  background-color: rgba(var(--v-theme-surface), 0.65) !important;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 24px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
}

.section-title {
  font-family: "Fraunces", Georgia, serif;
  font-size: 3rem !important;
}

.registration-step-button {
  font-family: "Inter", sans-serif;
}

.welcome-title {
  width: 100%;
  max-width: 320px;
  height: auto;
}

.preferred-width {
  width: 840px;
}
</style>
