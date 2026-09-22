<template>
  <div>
    <v-container fluid class="d-flex justify-center align-center flex-column fill-height login-background">
      <v-alert v-if="isFirstLogin" class="my-4" type="info" :icon="$globals.icons.information"
        :style="{ flex: 'none' }">
        <div>
          <p class="mb-3">
            {{ $t('user.it-looks-like-this-is-your-first-time-logging-in') }}
          </p>
          <p class="mb-1">
            <strong>{{ $t('user.username') }}: </strong>changeme@example.com
            <AppButtonCopy copy-text="changeme@example.com" color="info" btn-class="h-auto" />
          </p>
          <p class="mb-3">
            <strong>{{ $t('user.password') }}: </strong>MyPassword
            <AppButtonCopy copy-text="MyPassword" color="info" btn-class="h-auto" />
          </p>
          <p>
            {{ $t('user.dont-want-to-see-this-anymore-be-sure-to-change-your-email') }}
          </p>
        </div>
      </v-alert>
      <img src="/welcome_title.png" alt="Petit Chef" class="welcome-title mb-4">
      <v-card tag="section" class="d-flex flex-column align-center w-100 glass-card" max-width="600">
        <v-card-title class="text-h5 text-center justify-center pb-3 login-title">
          {{ $t('user.sign-in') }}
        </v-card-title>
        <v-card-text class="w-100">
          <v-form @submit.prevent="authenticate">
            <v-text-field v-if="$appInfo.allowPasswordLogin" id="username" v-model="form.email"
              :prepend-inner-icon="$globals.icons.email" variant="underlined" color="primary" density="comfortable"
              width="100%" autofocus autocomplete="username" name="username" :label="$t('user.email-or-username')"
              type="text" />
            <v-text-field v-if="$appInfo.allowPasswordLogin" id="password" v-model="form.password"
              :prepend-inner-icon="$globals.icons.lock" :append-inner-icon="passwordIcon" variant="underlined"
              color="primary" density="comfortable" autocomplete="current-password" name="password"
              :label="$t('user.password')" :type="inputType" @click:append-inner="togglePasswordShow" />
            <div v-if="$appInfo.allowPasswordLogin" class="d-flex justify-center mt-n2">
              <v-checkbox v-model="form.remember" color="primary" :label="$t('user.remember-me')" />
            </div>
            <v-card-actions v-if="$appInfo.allowPasswordLogin" class="justify-center pt-0">
              <div class="max-button">
                <v-btn :loading="loggingIn" :disabled="oidcLoggingIn" variant="elevated" color="primary" type="submit"
                  size="large" rounded class="rounded-xl" block>
                  {{ $t("user.login") }}
                </v-btn>
              </div>
            </v-card-actions>

            <div v-if="$appInfo.enableOidc && $appInfo.allowPasswordLogin"
              class="d-flex my-4 justify-center align-center" width="80%">
              <v-divider class="div-width" />
              <span class="absolute px-2" :class="{
                'bg-white': !$vuetify.theme.current.dark && !isDark,
                'bg-grey-darken-4': $vuetify.theme.current.dark || isDark,
              }">
                {{ $t("user.or") }}
              </span>
            </div>
            <v-card-actions v-if="$appInfo.enableOidc" class="justify-center">
              <div class="max-button">
                <v-btn :loading="oidcLoggingIn" color="primary" size="large" variant="elevated" rounded
                  class="rounded-xl" block @click="() => oidcAuthenticate()">
                  {{ $t("user.login-oidc") }} {{ $appInfo.oidcProviderName }}
                </v-btn>
              </div>
            </v-card-actions>
          </v-form>
        </v-card-text>
        <v-card-actions class="d-flex justify-center flex-column flex-sm-row">
          <v-btn v-if="$appInfo.allowSignup && $appInfo.allowPasswordLogin" variant="text" to="/register">
            {{ $t("user.register") }}
          </v-btn>
          <v-btn v-else variant="text" disabled>
            {{ $t("user.invite-only") }}
          </v-btn>
          <v-btn v-if="$appInfo.allowPasswordLogin" variant="text" to="/forgot-password">
            {{ $t("user.reset-password") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>

    <footer class="login-footer d-flex justify-center flex-column flex-sm-row py-6">
      <v-theme-provider theme="dark" class="d-flex justify-center flex-column flex-sm-row">
        <div v-for="link in footerLinks" :key="link.text" class="text-center">
          <v-btn variant="text" :href="link.href" target="_blank">
            <v-icon start>
              {{ link.icon }}
            </v-icon>
            {{ link.text }}
          </v-btn>
        </div>
      </v-theme-provider>
    </footer>

    <CinematicTransition ref="cinematicTransition" />
  </div>
</template>

<script setup lang="ts">
import { useDark, useSessionStorage, whenever } from "@vueuse/core";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import { usePasswordField } from "~/composables/use-passwords";
import { alert } from "~/composables/use-toast";
import { useAsyncKey } from "~/composables/use-utils";
import { isSafeRedirectTarget } from "~/lib/validators/redirect";
import type { AppStartupInfo } from "~/lib/api/types/admin";
import { useUserActivityPreferences } from "~/composables/use-users/preferences";

definePageMeta({
  layout: "blank",
});
const isDark = useDark();

const router = useRouter();
const route = useRoute();
const i18n = useI18n();
const auth = useMealieAuth();
const { $appInfo, $axios, $globals } = useNuxtApp();
const { loggedIn } = useLoggedInState();
const groupSlug = computed(() => auth.user.value?.groupSlug);
const isDemo = ref(false);
const isFirstLogin = ref(false);
const activityPreferences = useUserActivityPreferences();
const { getDefaultActivityRoute } = useDefaultActivity();

// Survives the page reload that happens during OIDC redirect
const pendingShareRedirect = useSessionStorage<string | null>("pwa_share_redirect", null);

const cinematicTransition = ref<{ play: (zoomOutScale?: number, zoomInScale?: number) => Promise<void> } | null>(null);

async function navigateWithCinematic(target: string) {
  await cinematicTransition.value?.play();
  router.push(target);
}

useSeoMeta({
  title: i18n.t("user.login"),
});

const footerLinks = computed(() => [
  {
    text: i18n.t("about.sponsor"),
    icon: $globals.icons.heart,
    href: "https://github.com/sponsors/hay-kot",
  },
  {
    text: i18n.t("about.github"),
    icon: $globals.icons.github,
    href: "https://github.com/mealie-recipes/mealie",
  },
  {
    text: i18n.t("about.docs"),
    icon: $globals.icons.folderOutline,
    href: "https://docs.mealie.io/",
  },
]);

const form = reactive({
  email: "",
  password: "",
  // Defaults on: this is a self-hosted app people mostly reach from their own devices, and an
  // unticked box now ends the session when the browser closes.
  // Ideally this is off by default, but we've trained users for years to ignore this checkbox,
  // so turning it off would cause a headache for the majority of users.
  // Maybe we can revisit this in the future.
  remember: true,
});

useAsyncData(useAsyncKey(), async () => {
  const data = await $axios.get<AppStartupInfo>("/api/app/about/startup-info");
  isDemo.value = data.data.isDemo;
  isFirstLogin.value = data.data.isFirstLogin;

  if (data.data.isFirstLogin) {
    form.email = "changeme@example.com";
    form.password = "MyPassword";
  }
});

whenever(
  () => loggedIn.value && groupSlug.value,
  () => {
    // First-login setup always takes priority
    if (!isDemo.value && isFirstLogin.value && auth.user.value?.admin) {
      navigateWithCinematic("/admin/setup");
      return;
    }

    // After login, honour a pending PWA share redirect.
    // The redirect param can arrive via the URL query string (password login)
    // or via sessionStorage (OIDC login, where the OIDC provider reload clears
    // the query string).
    const redirectFromQuery = route.query.redirect as string | undefined;
    const redirectTarget = redirectFromQuery ?? pendingShareRedirect.value;
    if (isSafeRedirectTarget(redirectTarget)) {
      pendingShareRedirect.value = null;
      navigateWithCinematic(redirectTarget as string);
      return;
    }

    const defaultActivityRoute = getDefaultActivityRoute(
      activityPreferences.value.defaultActivity,
      groupSlug.value,
    );
    navigateWithCinematic(defaultActivityRoute || `/g/${groupSlug.value || ""}`);
  },
  { immediate: true },
);

const loggingIn = ref(false);
const oidcLoggingIn = ref(false);

const { passwordIcon, inputType, togglePasswordShow } = usePasswordField();

whenever(
  () => $appInfo.enableOidc && $appInfo.oidcRedirect && !isCallback() && !isDirectLogin() /* && !auth.check().valid */,
  () => oidcAuthenticate(),
  { immediate: true },
);

onBeforeMount(async () => {
  if (isCallback()) {
    await oidcAuthenticate(true);
  }
});

function isCallback() {
  const params = new URLSearchParams(window.location.search);
  return params.has("code") || params.has("error");
}

function isDirectLogin() {
  const params = new URLSearchParams(window.location.search);
  return params.has("direct") && params.get("direct") === "1";
}

async function oidcAuthenticate(callback = false) {
  if (callback) {
    oidcLoggingIn.value = true;
    try {
      await auth.oauthSignIn();
    }
    catch (error) {
      await router.replace("/login?direct=1");
      alertOnError(error);
    }
    oidcLoggingIn.value = false;
  }
  else {
    // Save any pending PWA share redirect before leaving for the OIDC provider.
    // The OIDC callback reloads the page, which clears the query string, so we
    // persist the target in sessionStorage and restore it after login.
    const redirectTarget = route.query.redirect as string | undefined;
    if (isSafeRedirectTarget(redirectTarget)) {
      pendingShareRedirect.value = redirectTarget;
    }
    navigateTo("/api/auth/oauth", { external: true }); // start the redirect process
  }
}

async function authenticate() {
  if (form.email.length === 0 || form.password.length === 0) {
    alert.error(i18n.t("user.please-enter-your-email-and-password"));
    return;
  }

  loggingIn.value = true;
  const formData = new FormData();
  formData.append("username", form.email);
  formData.append("password", form.password);
  formData.append("remember_me", String(form.remember));

  try {
    await auth.signIn(formData);
  }
  catch (error) {
    console.log(error);
    alertOnError(error);
  }
  loggingIn.value = false;
}

function alertOnError(error: any) {
  // TODO Check if error is an AxiosError, but isAxiosError is not working right now
  // See https://github.com/nuxt-community/axios-module/issues/550
  // Import $axios from useContext()
  // if ($axios.isAxiosError(error) && error.response?.status === 401) {
  if (error.response?.status === 401) {
    alert.error(i18n.t("user.invalid-credentials"));
  }
  else if (error.response?.status === 423) {
    alert.error(i18n.t("user.account-locked-please-try-again-later"));
  }
  else {
    alert.error(i18n.t("events.something-went-wrong"));
  }
}
</script>

<style lang="css" scoped>
/* Fix password manager autofill detection - Vuetify uses opacity:0 during animation */
:deep(.v-field__input) {
  opacity: 1 !important;
}
</style>

<style lang="css">
.max-button {
  width: 300px;
}

.login-background {
  background-image: url("/salle_wallpaper.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.login-footer {
  background-color: #212121;
}

.login-title {
  font-family: "Fraunces", Georgia, serif;
  font-size: 3rem !important;
}

.glass-card {
  background-color: rgba(var(--v-theme-surface), 0.65) !important;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 24px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
}

.welcome-title {
  width: 100%;
  max-width: 320px;
  height: auto;
}

.absolute {
  position: absolute;
}

.div-width {
  max-width: 75%;
}

.bg-white {
  background-color: #fff;
}
</style>
