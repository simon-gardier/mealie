<template>
  <div>
    <v-card-title class="text-h5 pt-0 text-center section-title">
      <span class="headline">{{ $t("user-registration.account-details") }}</span>
    </v-card-title>
    <v-divider />
    <v-card-text class="mt-2">
      <div class="d-flex flex-column align-center mb-4">
        <span class="avatar-prompt mb-2">{{ $t("user-registration.choose-avatar") }}</span>
        <UserAvatarPicker
          v-model="accountDetails.profileAvatar.value"
          @update:file="(file) => accountDetails.profileFile.value = file"
        />
      </div>
      <v-form ref="domAccountForm" v-model="isFormValid" @submit.prevent>
        <v-text-field
          v-model="accountDetails.username.value"
          autofocus
          v-bind="inputAttrs"
          :label="$t('user.username')"
          :prepend-icon="$globals.icons.user"
          :rules="[validators.required]"
          :error-messages="usernameErrorMessages"
          @blur="validateUsername"
        />
        <v-text-field
          v-model="accountDetails.fullName.value"
          v-bind="inputAttrs"
          :label="$t('user.full-name')"
          :prepend-icon="$globals.icons.user"
          :rules="[validators.required]"
        />
        <v-text-field
          v-model="accountDetails.email.value"
          v-bind="inputAttrs"
          :prepend-icon="$globals.icons.email"
          :label="$t('user.email')"
          :rules="[validators.required, validators.email]"
          :error-messages="emailErrorMessages"
          @blur="validateEmail"
        />
        <v-text-field
          v-model="credentials.password1.value"
          v-bind="inputAttrs"
          :type="pwFields.inputType.value"
          :append-inner-icon="pwFields.passwordIcon.value"
          :prepend-icon="$globals.icons.lock"
          :label="$t('user.password')"
          :rules="[validators.required, validators.minLength(8), validators.maxLength(258)]"
          @click:append-inner="pwFields.togglePasswordShow"
        />

        <UserPasswordStrength v-model="credentials.password1.value" />

        <v-text-field
          v-model="credentials.password2.value"
          v-bind="inputAttrs"
          :type="pwFields.inputType.value"
          :append-inner-icon="pwFields.passwordIcon.value"
          :prepend-icon="$globals.icons.lock"
          :label="$t('user.confirm-password')"
          :rules="[validators.required, credentials.passwordMatch]"
          @click:append-inner="pwFields.togglePasswordShow"
        />
        <div class="advanced-content-setting px-2">
          <v-checkbox
            v-model="accountDetails.advancedOptions.value"
            color="primary"
            hide-details
            :label="$t('user.enable-advanced-content')"
          />
          <v-menu location="bottom end" :close-on-content-click="false" max-width="340">
            <template #activator="{ props: infoProps }">
              <v-btn
                v-bind="infoProps"
                class="advanced-content-info"
                icon
                variant="text"
                color="primary"
                :aria-label="$t('user.enable-advanced-content')"
              >
                <v-icon :icon="$globals.icons.informationOutline" size="22" />
              </v-btn>
            </template>
            <v-card color="surface-elevated" rounded="lg">
              <v-card-text class="text-body-2">
                {{ $t("user.enable-advanced-content-description") }}
              </v-card-text>
            </v-card>
          </v-menu>
        </div>
      </v-form>
    </v-card-text>
  </div>
</template>

<script setup lang="ts">
import { validators } from "~/composables/use-validators";
import { useUserRegistrationForm } from "~/composables/use-users/user-registration-form";
import { usePasswordField } from "~/composables/use-passwords";
import UserPasswordStrength from "~/components/Domain/User/UserPasswordStrength.vue";
import UserAvatarPicker from "~/components/Domain/User/UserAvatarPicker.vue";

const inputAttrs = {
  validateOnBlur: true,
  class: "pb-1",
  variant: "filled" as any,
  color: "primary",
  density: "comfortable" as any,
};
const emit = defineEmits(["update:modelValue"]);
const isFormValid = ref(false);

const pwFields = usePasswordField();
const {
  accountDetails,
  credentials,
  emailErrorMessages,
  usernameErrorMessages,
  validateUsername,
  validateEmail,
  domAccountForm,
} = useUserRegistrationForm();
watch(
  isFormValid,
  (val) => {
    emit("update:modelValue", val);
  },
  { immediate: true },
);
</script>

<style lang="css" scoped>
.advanced-content-setting {
  display: flex;
  align-items: center;
  gap: 8px;
}
.advanced-content-setting > .v-input {
  flex: 1;
  min-width: 0;
}
.advanced-content-info {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  border-radius: 10px;
}

.section-title {
  font-family: "Fraunces", Georgia, serif;
  font-size: 2.5rem !important;
}

.avatar-prompt {
  font-family: "Fraunces", Georgia, serif;
  font-size: 1.5rem;
}

.icon-primary {
  fill: var(--v-primary-base);
}

.icon-white {
  fill: white;
}

.icon-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  position: relative;
  margin-top: 2.5rem;
}

.icon-divider {
  width: 100%;
  margin-bottom: -2.5rem;
}

.icon-avatar {
  border-color: rgba(var(--v-theme-media-scrim), 0.12);
  border: 2px;
}

.bg-off-white {
  background: rgb(var(--v-theme-background));
}

.preferred-width {
  width: 840px;
}
</style>
