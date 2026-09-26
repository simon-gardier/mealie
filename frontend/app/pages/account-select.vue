<template>
  <div class="account-select-background d-flex flex-column justify-center align-center fill-height">
    <div class="account-select-scrim" />
    <div class="account-select-content d-flex flex-column align-center">
      <h1 class="account-select-heading mb-8">
        {{ $t("user.who-is-cooking-today") }}
      </h1>

      <div class="d-flex flex-wrap justify-center account-select-list">
        <div
          v-for="account in displayAccounts"
          :key="account.id"
          class="account-select-item text-center"
        >
          <button
            type="button"
            class="account-select-button"
            :disabled="busy"
            @click="selectAccount(account)"
          >
            <v-avatar size="128" class="account-select-avatar">
              <v-img :src="avatarUrl(account.id)" :alt="account.fullName">
                <template #error>
                  <v-img src="/fallback-profile.webp" :alt="account.fullName" />
                </template>
              </v-img>
            </v-avatar>
            <div class="account-select-name mt-3">
              {{ account.fullName }}
            </div>
            <div v-if="account.id === currentUserId" class="account-select-subtitle">
              {{ $t("user.signed-in") }}
            </div>
          </button>
          <v-btn
            v-if="account.id !== currentUserId"
            variant="text"
            size="x-small"
            color="white"
            :disabled="busy"
            @click="forget(account.id)"
          >
            {{ $t("user.forget-account") }}
          </v-btn>
        </div>
      </div>

      <v-btn
        variant="outlined"
        color="white"
        rounded
        class="rounded-xl mt-10"
        :disabled="busy"
        @click="useAnotherAccount"
      >
        {{ $t("user.use-another-account") }}
      </v-btn>
    </div>

    <CinematicTransition ref="cinematicTransition" />
  </div>
</template>

<script setup lang="ts">
import { useAccountSelected, useRememberedAccounts, type RememberedAccount } from "~/composables/use-remembered-accounts";
import { useUserActivityPreferences } from "~/composables/use-users/preferences";
import { isSafeRedirectTarget } from "~/lib/validators/redirect";

definePageMeta({
  layout: "blank",
});

const router = useRouter();
const route = useRoute();
const i18n = useI18n();
const auth = useMealieAuth();
const { accounts, forget } = useRememberedAccounts();
const accountSelected = useAccountSelected();
const activityPreferences = useUserActivityPreferences();
const { getDefaultActivityRoute } = useDefaultActivity();

const busy = ref(false);
const cinematicTransition = ref<{ play: (zoomOutScale?: number, zoomInScale?: number) => Promise<void> } | null>(null);

useSeoMeta({
  title: i18n.t("user.who-is-cooking-today"),
});

const currentUserId = computed(() => auth.user.value?.id);

// Guards against a cleared localStorage leaving the signed-in user with nothing to click.
const displayAccounts = computed<RememberedAccount[]>(() => {
  const user = auth.user.value;
  if (!user || accounts.value.some(account => account.id === user.id)) {
    return accounts.value;
  }

  return [
    {
      id: user.id,
      username: user.username || "",
      fullName: user.fullName || user.username || "",
      groupSlug: user.groupSlug || "",
      lastSeen: Date.now(),
    },
    ...accounts.value,
  ];
});

function avatarUrl(userId: string) {
  return `/api/media/users/${userId}/profile.webp?cacheKey=${auth.user.value?.cacheKey ?? ""}`;
}

function enterTarget() {
  const redirect = route.query.redirect as string | undefined;
  if (isSafeRedirectTarget(redirect)) {
    return redirect;
  }

  const groupSlug = auth.user.value?.groupSlug || "";
  return getDefaultActivityRoute(activityPreferences.value.defaultActivity, groupSlug) || `/g/${groupSlug}`;
}

async function selectAccount(account: RememberedAccount) {
  if (busy.value) {
    return;
  }
  busy.value = true;

  // Only the signed-in account can walk straight in - anyone else has to prove it.
  if (account.id !== currentUserId.value) {
    accountSelected.value = true;
    await auth.signOut(`/login?username=${encodeURIComponent(account.username)}`);
    return;
  }

  accountSelected.value = true;
  await cinematicTransition.value?.play();
  router.push(enterTarget());
}

async function useAnotherAccount() {
  busy.value = true;
  accountSelected.value = true;
  await auth.signOut("/login");
}

onMounted(() => {
  if (!auth.loggedIn.value) {
    router.replace("/login");
  }
});
</script>

<style lang="css" scoped>
.account-select-background {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background-image: url("/anyone_can_cook.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.account-select-scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
}

.account-select-content {
  position: relative;
  padding: 3rem 1rem;
  width: 100%;
}

.account-select-heading {
  font-family: "Fraunces", Georgia, serif;
  font-size: 2.25rem;
  font-weight: 500;
  color: #fff;
  text-align: center;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
}

.account-select-list {
  gap: 2rem;
  max-width: 900px;
}

.account-select-item {
  width: 160px;
}

.account-select-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 100%;
}

.account-select-button:disabled {
  cursor: default;
}

.account-select-avatar {
  border: 3px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  transition: transform 200ms ease, border-color 200ms ease;
}

.account-select-button:hover .account-select-avatar,
.account-select-button:focus-visible .account-select-avatar {
  transform: scale(1.06);
  border-color: #fff;
}

.account-select-name {
  color: #fff;
  font-size: 1.15rem;
  font-weight: 500;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}

.account-select-subtitle {
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.85rem;
}
</style>
