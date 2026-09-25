<template>
  <v-navigation-drawer v-model="modelValue" class="bistro-sidebar d-flex flex-column d-print-none position-fixed"
    temporary floating touchless :scrim="false" :close-on-content-click="true">
    <div class="bistro-sidebar-header d-flex align-center ga-2 px-3 py-2">
      <v-btn icon variant="text" @click.stop="modelValue = false">
        <v-icon>{{ $globals.icons.menu }}</v-icon>
      </v-btn>
      <RouterLink to="/" class="bistro-wordmark d-flex align-center ga-2">
        <span>Petit Chef</span>
        <img src="/remy_logo.png" width="42" height="42" alt="" aria-hidden="true" class="remy-logo">
      </RouterLink>
    </div>

    <AnnouncementDialog v-model="showAnnouncementsDialog" />
    <LanguageDialog v-model="state.languageDialog" />
    <slot />

    <!-- Primary Links -->
    <template v-if="topLink">
      <v-list v-model:selected="state.secondarySelected" nav density="comfortable" color="primary">
        <template v-for="nav in topLink">
          <div v-if="!nav.restricted || isOwnGroup" :key="nav.key || nav.title">
            <!-- Multi Items -->
            <v-list-group v-if="nav.children" :key="(nav.key || nav.title) + 'multi-item'"
              v-model="state.dropDowns[nav.title]" color="primary" :prepend-icon="nav.icon" :fluid="true">
              <template #activator="{ props: hoverProps }">
                <v-list-item v-bind="hoverProps" :prepend-icon="nav.icon" :title="nav.title" />
              </template>

              <v-list-item v-for="child in nav.children" :key="child.key || child.title" exact :to="child.to"
                :prepend-icon="child.icon" :title="child.title" class="ml-4" />
            </v-list-group>

            <!-- Single Item -->
            <template v-else>
              <v-list-item :key="(nav.key || nav.title) + 'single-item'" exact link :to="nav.to"
                :prepend-icon="nav.icon" :title="nav.title" />
            </template>
          </div>
        </template>
      </v-list>
    </template>

    <!-- Secondary Links -->
    <template v-if="secondaryLinks.length > 0">
      <v-divider class="mt-2" />
      <v-list v-model:selected="state.secondarySelected" nav density="compact" exact>
        <template v-for="nav in secondaryLinks">
          <div v-if="!nav.restricted || isOwnGroup" :key="nav.key || nav.title">
            <!-- Multi Items -->
            <v-list-group v-if="nav.children" :key="(nav.key || nav.title) + 'multi-item'"
              v-model="state.dropDowns[nav.title]" color="primary" :prepend-icon="nav.icon" fluid>
              <template #activator="{ props: hoverProps }">
                <v-list-item v-bind="hoverProps" :prepend-icon="nav.icon" :title="nav.title" />
              </template>

              <v-list-item v-for="child in nav.children" :key="child.key || child.title" exact :to="child.to"
                class="ml-2" :prepend-icon="child.icon" :title="child.title" />
            </v-list-group>

            <!-- Single Item -->
            <v-list-item v-else :key="(nav.key || nav.title) + 'single-item'" exact link :to="nav.to">
              <template #prepend>
                <v-icon>{{ nav.icon }}</v-icon>
              </template>
              <v-list-item-title>{{ nav.title }}</v-list-item-title>
            </v-list-item>
          </div>
        </template>
      </v-list>
    </template>

    <!-- Bottom Navigation Links -->
    <template #append>
      <v-list v-model:selected="state.bottomSelected" nav density="comfortable">
        <v-sheet v-if="loggedIn && sessionUser"
          class="sidebar-user-panel d-flex align-center justify-space-between ga-2 w-100" elevation="2"
          :color="$vuetify.theme.current.dark ? 'background-lighten-1' : 'background-darken-1'">
          <RouterLink :to="userProfileLink"
            class="sidebar-user-avatar-link d-flex align-center ga-2 text-decoration-none">
            <UserAvatar list :user-id="sessionUser.id" :tooltip="false" />
          </RouterLink>
          <div class="d-flex align-center ga-1">
            <v-btn v-if="loggedIn && announcementsEnabled" variant="flat" rounded="circle" size="small" color="info"
              class="sidebar-icon-button" :aria-label="$t('announcements.announcements')"
              @click.stop="() => showAnnouncementsDialog = !showAnnouncementsDialog">
              <v-badge :model-value="Boolean(newAnnouncements.length)" color="accent" :content="newAnnouncements.length"
                floating offset-x="7" offset-y="-5">
                <v-icon :icon="$globals.icons.bullhornVariant" color="white" />
              </v-badge>
            </v-btn>
            <v-menu location="end bottom" :offset="15" :z-index="3000" content-class="sidebar-settings-menu">
              <template #activator="{ props: hoverProps }">
                <v-btn v-bind="hoverProps" variant="flat" rounded="circle" size="small" color="info"
                  class="sidebar-icon-button" :aria-label="$t('general.settings')">
                  <v-icon color="white">
                    {{ $globals.icons.cog }}
                  </v-icon>
                </v-btn>
              </template>
              <v-list density="comfortable" color="primary">
                <v-list-item :prepend-icon="$globals.icons.translate" :title="$t('sidebar.language')"
                  @click="state.languageDialog = true" />
                <v-list-item
                  :prepend-icon="$vuetify.theme.current.dark ? $globals.icons.weatherSunny : $globals.icons.weatherNight"
                  :title="$vuetify.theme.current.dark ? $t('settings.theme.light-mode') : $t('settings.theme.dark-mode')"
                  @click="toggleDark" />
                <v-divider class="my-2" />
                <WakelockSwitch />
                <v-list-item :title="$t('settings.disable-cheese-drop')">
                  <template #append>
                    <v-switch v-model="disableCheeseDrop" color="primary" hide-details />
                  </template>
                </v-list-item>
                <v-divider v-if="loggedIn" class="my-2" />
                <v-list-item v-if="loggedIn" :prepend-icon="$globals.icons.cog" :title="$t('profile.user-settings')"
                  to="/user/profile" />
                <v-list-item v-if="isAdmin" :prepend-icon="$globals.icons.wrench" :title="$t('settings.admin-settings')"
                  to="/admin/site-settings" />
                <v-list-item v-if="canManage" :prepend-icon="$globals.icons.manageData"
                  :title="$t('data-pages.data-management')" to="/group/data" />
              </v-list>
            </v-menu>
            <v-btn v-if="loggedIn" variant="flat" rounded="circle" size="small" color="info" class="disconnect-button"
              :aria-label="$t('user.logout')" @click.stop="logout()">
              <v-icon color="white">
                {{ $globals.icons.logout }}
              </v-icon>
            </v-btn>
          </div>
        </v-sheet>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import type { SidebarLinks } from "~/types/application-types";
import AnnouncementDialog from "~/components/Domain/Announcement/AnnouncementDialog.vue";
import UserAvatar from "~/components/Domain/User/UserAvatar.vue";
import { useToggleDarkMode } from "~/composables/use-utils";
import { useAnnouncements } from "~/composables/use-announcements";

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  topLink: {
    type: Array as () => SidebarLinks,
    required: true,
  },
  secondaryLinks: {
    type: Array as () => SidebarLinks,
    required: false,
    default: null,
  },
});

const modelValue = defineModel<boolean>({ default: false });

const auth = useMealieAuth();
const sessionUser = computed(() => auth.user.value);
const { loggedIn, isOwnGroup } = useLoggedInState();
const isAdmin = computed(() => auth.user.value?.admin);
const canManage = computed(() => auth.user.value?.canManage);

const userProfileLink = computed(() => auth.user.value ? "/user/profile" : undefined);

const toggleDark = useToggleDarkMode();
const disableCheeseDrop = useLocalStorage("disable-cheese-drop", false);

async function logout() {
  try {
    await auth.signOut("/login?direct=1");
  }
  catch (e) {
    console.error(e);
  }
}

const showAnnouncementsDialog = ref(false);
const { announcementsEnabled, newAnnouncements } = useAnnouncements();

const state = reactive({
  dropDowns: {} as Record<string, boolean>,
  secondarySelected: null as string[] | null,
  bottomSelected: null as string[] | null,
  languageDialog: false as boolean,
});

const allLinks = computed(() => [...props.topLink, ...(props.secondaryLinks || [])]);
function initDropdowns() {
  allLinks.value.forEach((link) => {
    state.dropDowns[link.title] = link.childrenStartExpanded || false;
  });
}
watch(
  () => allLinks,
  () => {
    initDropdowns();
  },
  {
    deep: true,
  },
);
</script>

<style scoped>
.remy-logo {
  object-fit: contain;
}

.bistro-sidebar {
  z-index: 2021 !important;
  top: 0 !important;
  height: 100vh !important;
  max-height: 100vh !important;
  overflow-y: auto;
}

.bistro-sidebar :deep(.v-navigation-drawer__content) {
  padding-top: 0;
}

@media (max-width: 600px) {
  .bistro-sidebar {
    width: 100vw !important;
    max-width: 100vw !important;
  }
}

@media print {
  .no-print {
    display: none;
  }
}

.favorites-link {
  text-decoration: none;
}

.favorites-link:hover {
  text-decoration: underline;
}

.disconnect-button,
.sidebar-icon-button {
  min-width: 32px !important;
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  border-radius: 50% !important;
}

.disconnect-button {
  min-width: 32px !important;
  padding-inline: 0 !important;
}

.sidebar-user-avatar-link {
  display: inline-flex;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgb(var(--v-theme-info));
  padding: 4px;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
}

.sidebar-user-avatar-link :deep(.user-avatar),
.sidebar-user-avatar-link :deep(img),
.sidebar-user-avatar-link :deep(.v-avatar) {
  width: 100% !important;
  height: 100% !important;
  border-radius: 50% !important;
}

.sidebar-user-panel {
  padding: 8px;
  border-radius: 8px;
}

:deep(.sidebar-settings-menu) {
  z-index: 3000 !important;
}
</style>
