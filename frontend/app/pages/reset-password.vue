<template>
  <v-container fluid class="reset-password-page">
    <v-card tag="section" aria-labelledby="reset-password-title" class="reset-password-card" color="surface" flat>
      <header class="reset-password-heading">
        <h1 id="reset-password-title">
          {{ $t('user.reset-password') }}
        </h1>
        <p>{{ $t('user.please-enter-password') }}</p>
      </header>
      <v-form ref="form" validate-on="submit" @submit.prevent="requestLink()">
        <div class="reset-password-fields">
          <v-text-field
            v-model="state.email"
            :prepend-inner-icon="$globals.icons.email"
            variant="filled"
            density="comfortable"
            name="email"
            autocomplete="username"
            :label="$t('user.email')"
            type="email"
            :rules="[validators.required, validators.email]"
            :disabled="state.loading"
            hide-details="auto"
          />
          <v-text-field
            v-model="state.password"
            :prepend-inner-icon="$globals.icons.lock"
            variant="filled"
            density="comfortable"
            name="new-password"
            autocomplete="new-password"
            :label="$t('user.password')"
            type="password"
            :rules="[validators.required]"
            :disabled="state.loading"
            hide-details="auto"
          />
          <v-text-field
            v-model="state.passwordConfirm"
            :prepend-inner-icon="$globals.icons.lock"
            variant="filled"
            density="comfortable"
            name="password-confirm"
            autocomplete="new-password"
            :label="$t('user.confirm-password')"
            type="password"
            :rules="[validators.required, passwordMatch]"
            :disabled="state.loading"
            hide-details="auto"
          />
        </div>
        <p v-if="!token" class="reset-password-link-help">
          {{ $t('user.reset-password-link-required') }}
          <NuxtLink to="/forgot-password">{{ $t('user.request-password-reset-link') }}</NuxtLink>
        </p>
        <v-btn
          class="reset-password-submit"
          :loading="state.loading"
          color="primary"
          variant="tonal"
          :disabled="!token || state.loading || !state.email.trim() || !state.password || !state.passwordConfirm"
          :prepend-icon="$globals.icons.lock"
          type="submit"
          block
        >
          {{ $t('user.reset-password') }}
        </v-btn>
      </v-form>
      <div class="reset-password-footer">
        <v-btn variant="text" color="primary" to="/login">
          {{ $t('user.login') }}
        </v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";
import { validators } from "@/composables/use-validators";
import { useRouteQuery } from "~/composables/use-router";
import type { VForm } from "~/types/auto-forms";

definePageMeta({
  layout: "basic",
});

const state = reactive({
  email: "",
  password: "",
  passwordConfirm: "",
  loading: false,
  error: false,
});

const form = ref<VForm | null>(null);

const i18n = useI18n();
const passwordMatch = () => state.password === state.passwordConfirm || i18n.t("user.password-must-match");

// Set page title
useSeoMeta({
  title: i18n.t("user.reset-password"),
});

// ===================
// Token Getter
const token = useRouteQuery("token", "");

// ===================
// API
const api = useUserApi();
async function requestLink() {
  if (!form.value || state.loading || !token.value) {
    return;
  };

  const { valid } = await form.value.validate();
  if (!valid) {
    return;
  };

  state.loading = true;
  // TODO: Fix Response to send meaningful error
  const { response } = await api.users.resetPassword({
    token: token.value,
    email: state.email,
    password: state.password,
    passwordConfirm: state.passwordConfirm,
  });

  state.loading = false;

  if (response?.status === 200) {
    state.error = false;
    alert.success(i18n.t("user.password-updated"));
    await navigateTo("/login");
  }
  else {
    state.error = true;
    alert.error(i18n.t("events.something-went-wrong"));
  }
}
</script>

<style scoped>
.reset-password-page {
  display: flex;
  justify-content: center;
  padding: calc(var(--bistro-header-bottom, 72px) + 24px) 24px 32px;
}
.reset-password-card {
  width: 100%;
  max-width: 520px;
  padding: 24px;
  border: 1px solid rgb(var(--v-theme-separator), 0.5);
  border-radius: 20px;
}
.reset-password-heading {
  margin-bottom: 24px;
}
.reset-password-heading h1 {
  color: rgb(var(--v-theme-on-surface));
  font: 600 22px/1.35 var(--bistro-body);
  font-family: var(--bistro-body) !important;
  margin: 0 0 8px;
}
.reset-password-heading p,
.reset-password-link-help {
  color: rgb(var(--v-theme-text-secondary));
  font-size: 14px;
  line-height: 1.5;
}
.reset-password-fields {
  display: grid;
  gap: 16px;
}
.reset-password-link-help {
  margin-top: 16px;
}
.reset-password-link-help a {
  display: block;
  margin-top: 4px;
}
.reset-password-submit {
  min-height: 44px;
  height: auto;
  margin-top: 24px;
  padding: 12px 16px;
  border-radius: 10px;
  text-transform: none;
}
.reset-password-submit :deep(.v-btn__content) {
  white-space: normal;
  text-align: center;
  overflow-wrap: anywhere;
}
.reset-password-footer {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  margin-top: 24px;
  border-top: 1px solid rgb(var(--v-theme-separator), 0.5);
}
@media (max-width: 600px) {
  .reset-password-page {
    padding: calc(var(--bistro-header-bottom, 72px) + 16px) 16px 24px;
  }
  .reset-password-card {
    padding: 20px 16px;
  }
}
</style>
