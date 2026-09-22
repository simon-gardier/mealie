<template>
  <v-app-bar clipped-left density="compact" app color="surface" class="bistro-header d-print-none">
    <slot />
    <RouterLink :to="routerLink" class="bistro-wordmark">
      <v-icon size="30" aria-hidden="true">{{ mdiChefHat }}</v-icon>
      <span>Petit Chef</span>
    </RouterLink>
    <RecipeDialogSearch ref="domSearchDialog" />

    <v-spacer />

    <!-- Navigation Menu -->
    <template v-if="menu">
      <v-responsive v-if="!xs" max-width="250" class="bistro-search-bar" @click="activateSearch">
        <v-text-field readonly class="mt-1" rounded variant="solo-filled" density="compact" flat
          :prepend-inner-icon="$globals.icons.search" bg-color="background" :placeholder="$t('search.search-hint')"
          @keydown.enter="activateSearch" @keydown.space.prevent="activateSearch" />
      </v-responsive>
      <v-btn v-else :aria-label="$t('search.search')" icon @click="activateSearch">
        <v-icon> {{ $globals.icons.search }}</v-icon>
      </v-btn>
      <v-btn v-if="loggedIn" :aria-label="$t('user.logout')" :variant="smAndUp ? 'text' : undefined" :icon="xs"
        @click="logout()">
        <v-icon :start="smAndUp">
          {{ $globals.icons.logout }}
        </v-icon>
        {{ smAndUp ? $t("user.logout") : "" }}
      </v-btn>
      <v-btn v-else variant="text" nuxt to="/login">
        <v-icon start>
          {{ $globals.icons.user }}
        </v-icon>
        {{ $t("user.login") }}
      </v-btn>
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
import { mdiChefHat } from "@mdi/js";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import type RecipeDialogSearch from "~/components/Domain/Recipe/RecipeDialogSearch.vue";

defineProps({
  menu: {
    type: Boolean,
    default: true,
  },
});
const auth = useMealieAuth();
const { loggedIn } = useLoggedInState();
const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");
const { xs, smAndUp } = useDisplay();

const routerLink = computed(() => groupSlug.value ? `/g/${groupSlug.value}` : "/");
const domSearchDialog = ref<InstanceType<typeof RecipeDialogSearch> | null>(null);

function activateSearch() {
  domSearchDialog.value?.open();
}

function handleKeyEvent(e: KeyboardEvent) {
  const activeTag = document.activeElement?.tagName;
  if (e.key === "/" && activeTag !== "INPUT" && activeTag !== "TEXTAREA") {
    e.preventDefault();
    activateSearch();
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleKeyEvent);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeyEvent);
});

async function logout() {
  try {
    await auth.signOut("/login?direct=1");
  }
  catch (e) {
    console.error(e);
  }
}
</script>

<style scoped>
.v-toolbar {
  z-index: 2010 !important;
}
</style>
