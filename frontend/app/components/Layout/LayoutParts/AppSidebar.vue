<template>
  <v-navigation-drawer
    id="app-sidebar"
    v-model="modelValue"
    class="bistro-sidebar d-flex flex-column d-print-none"
    :class="{ 'bistro-sidebar-mobile': display.smAndDown.value }"
    color="surface"
    temporary
    floating
    :order="-1"
    :width="display.smAndDown.value ? '100%' : 280"
    :scrim="true"
    :aria-label="$t('general.menu')"
  >
    <div class="bistro-sidebar-header d-flex align-center ga-2 px-3 py-2">
      <v-btn
        icon
        variant="text"
        color="text-primary"
        class="bistro-navigation-toggle"
        :aria-label="$t('general.close')"
        @click.stop="modelValue = false"
      >
        <v-icon>{{ $globals.icons.menu }}</v-icon>
      </v-btn>
      <RouterLink to="/" class="bistro-wordmark d-flex align-center ga-2">
        <span>Petit Chef</span>
        <img
          src="/remy_logo.png"
          width="63"
          height="63"
          alt=""
          aria-hidden="true"
          class="remy-logo"
        >
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
            <v-list-group
              v-if="nav.children"
              :key="(nav.key || nav.title) + 'multi-item'"
              v-model="state.dropDowns[nav.title]"
              color="primary"
              :prepend-icon="nav.icon"
              :fluid="true"
            >
              <template #activator="{ props: hoverProps }">
                <v-list-item v-bind="hoverProps" :prepend-icon="nav.icon" :title="nav.title" />
              </template>

              <v-list-item
                v-for="child in nav.children"
                :key="child.key || child.title"
                exact
                :to="child.to"
                :prepend-icon="child.icon"
                :title="child.title"
                class="ml-4"
              />
            </v-list-group>

            <!-- Single Item -->
            <template v-else>
              <v-list-item
                :key="(nav.key || nav.title) + 'single-item'"
                exact
                link
                :to="nav.to"
                :prepend-icon="nav.icon"
                :title="nav.title"
              />
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
            <v-list-group
              v-if="nav.children"
              :key="(nav.key || nav.title) + 'multi-item'"
              v-model="state.dropDowns[nav.title]"
              color="primary"
              :prepend-icon="nav.icon"
              fluid
            >
              <template #activator="{ props: hoverProps }">
                <v-list-item v-bind="hoverProps" :prepend-icon="nav.icon" :title="nav.title" />
              </template>

              <v-list-item
                v-for="child in nav.children"
                :key="child.key || child.title"
                exact
                :to="child.to"
                class="ml-2"
                :prepend-icon="child.icon"
                :title="child.title"
              />
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
      <v-list v-model:selected="state.bottomSelected" class="sidebar-account-footer" nav density="comfortable">
        <div
          v-if="loggedIn && sessionUser"
          class="sidebar-user-panel d-flex align-center ga-2 w-100"
        >
          <RouterLink
            :to="userProfileLink"
            class="sidebar-user-avatar-link d-flex align-center ga-2 text-decoration-none"
            :aria-label="$t('profile.user-settings')"
          >
            <UserAvatar list :user-id="sessionUser.id" :tooltip="false" />
            <span class="sidebar-user-name">{{ sessionUser.fullName || sessionUser.username }}</span>
          </RouterLink>
          <div class="sidebar-user-actions d-flex align-center">
            <v-menu
              location="top start"
              :offset="8"
              :max-width="380"
              :max-height="600"
              :close-on-content-click="false"
              content-class="sidebar-settings-menu"
            >
              <template #activator="{ props: hoverProps }">
                <v-btn
                  v-bind="hoverProps"
                  variant="text"
                  color="text-primary"
                  class="sidebar-icon-button"
                  :aria-label="$t('general.settings')"
                >
                  <v-icon>
                    {{ $globals.icons.cog }}
                  </v-icon>
                </v-btn>
              </template>
              <v-list density="comfortable" color="primary">
                <v-list-item
                  v-if="announcementsEnabled"
                  :prepend-icon="$globals.icons.bullhornVariant"
                  :title="$t('announcements.announcements')"
                  @click="showAnnouncementsDialog = true"
                >
                  <template v-if="newAnnouncements.length" #append>
                    <v-badge inline color="primary" :content="newAnnouncements.length" />
                  </template>
                </v-list-item>
                <v-list-item
                  :prepend-icon="$globals.icons.translate"
                  :title="$t('sidebar.language')"
                  @click="state.languageDialog = true"
                />
                <v-list-item
                  :prepend-icon="$vuetify.theme.current.dark ? $globals.icons.weatherSunny : $globals.icons.weatherNight"
                  :title="$vuetify.theme.current.dark ? $t('settings.theme.light-mode') : $t('settings.theme.dark-mode')"
                  @click="toggleDark"
                />
                <v-divider class="my-2" />
                <WakelockSwitch />
                <v-list-item
                  :prepend-icon="$globals.icons.volumeHigh"
                  :title="$t('settings.ambiance-music')"
                  @click.stop
                >
                  <template #append>
                    <v-switch v-model="ambianceMusicEnabled" :aria-label="$t('settings.ambiance-music')" color="primary" hide-details />
                  </template>
                </v-list-item>
                <v-list-item :prepend-icon="$globals.icons.bread" :title="$t('settings.enable-cheese-drop')">
                  <template #append>
                    <v-switch v-model="cheeseDropEnabled" :aria-label="$t('settings.enable-cheese-drop')" color="primary" hide-details />
                  </template>
                </v-list-item>
                <v-divider v-if="loggedIn" class="my-2" />
                <v-list-item
                  v-if="loggedIn"
                  :prepend-icon="$globals.icons.cog"
                  :title="$t('profile.user-settings')"
                  to="/user/profile"
                />
                <v-list-item
                  v-if="isAdmin"
                  :prepend-icon="$globals.icons.wrench"
                  :title="$t('settings.admin-settings')"
                  to="/admin/site-settings"
                />
                <v-list-item
                  v-if="canManage"
                  :prepend-icon="$globals.icons.manageData"
                  :title="$t('data-pages.data-management')"
                  to="/group/data"
                />
                <v-divider class="my-2" />
                <v-list-item :prepend-icon="$globals.icons.logout" :title="$t('user.logout')" @click="logout()" />
              </v-list>
            </v-menu>
          </div>
        </div>
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
import { useAmbianceMusicEnabled } from "~/composables/use-ambiance-music";

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
const display = useDisplay();

const auth = useMealieAuth();
const sessionUser = computed(() => auth.user.value);
const { loggedIn, isOwnGroup } = useLoggedInState();
const isAdmin = computed(() => auth.user.value?.admin);
const canManage = computed(() => auth.user.value?.canManage);

const userProfileLink = computed(() => auth.user.value ? "/user/profile" : undefined);

const toggleDark = useToggleDarkMode();
const disableCheeseDrop = useLocalStorage("disable-cheese-drop", false);
const cheeseDropEnabled = computed({
  get: () => !disableCheeseDrop.value,
  set: (enabled: boolean) => disableCheeseDrop.value = !enabled,
});
const ambianceMusicEnabled = useAmbianceMusicEnabled();

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
:global(.bistro-sidebar + .v-navigation-drawer__scrim) {
  background: transparent !important;
}

:global(.sidebar-settings-menu .v-list-item) {
  --v-list-prepend-gap: 12px;
}

.remy-logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
}
.bistro-sidebar {
  background: rgb(var(--v-theme-surface));
  border-inline-end: 1px solid rgba(var(--v-theme-separator), 0.6);
  box-shadow: 8px 0 24px rgba(var(--v-theme-shadow), 0.12);
}
.bistro-sidebar-header {
  min-height: 64px;
  border-bottom: 1px solid rgba(var(--v-theme-separator), 0.6);
}
.bistro-sidebar-header .bistro-wordmark {
  font-size: 22px;
  padding: 0;
  gap: 4px;
}
.bistro-sidebar :deep(.v-navigation-drawer__content) {
  padding-top: 0;
}
.bistro-sidebar :deep(.v-list) {
  padding: 8px 12px;
}
.bistro-sidebar :deep(.v-list-item) {
  min-height: 44px;
  border-radius: 10px;
  margin-bottom: 4px;
  --v-list-prepend-gap: 12px;
}
.bistro-sidebar :deep(.v-list-item-title) {
  font-family: var(--bistro-body);
  font-size: 14px;
  line-height: 1.5;
  letter-spacing: normal;
  white-space: normal;
}
.bistro-sidebar :deep(.v-list-item--active) {
  background: rgba(var(--v-theme-primary), 0.1);
}
.bistro-sidebar :deep(.v-list-item--active .v-list-item-title) {
  text-decoration: none;
  font-weight: 600;
}
.bistro-sidebar :deep(.v-list-item__prepend > .v-icon) {
  font-size: 22px;
}
.sidebar-user-panel {
  border-top: 1px solid rgba(var(--v-theme-separator), 0.6);
  padding: 12px 0 0;
}
.sidebar-account-footer {
  background: transparent;
  padding-bottom: max(12px, env(safe-area-inset-bottom)) !important;
}
.sidebar-user-avatar-link {
  color: rgb(var(--v-theme-text-primary)) !important;
  padding: 4px;
  border-radius: 10px;
  flex: 1;
  min-width: 0;
}
.sidebar-user-name {
  font: 500 14px var(--bistro-body);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sidebar-user-avatar-link :deep(.v-avatar) {
  flex-shrink: 0;
}
.sidebar-user-actions {
  flex-shrink: 0;
}
.disconnect-button,
.sidebar-icon-button,
.bistro-navigation-toggle {
  min-width: 44px !important;
  width: 44px !important;
  height: 44px !important;
  border-radius: 10px !important;
  padding: 0 !important;
}
.bistro-sidebar-mobile :deep(.v-list-item) {
  min-height: 56px;
  --v-list-prepend-gap: 16px;
}
.bistro-sidebar-mobile :deep(.v-list-item-title) {
  font-size: 16px;
}
.bistro-sidebar-mobile :deep(.v-list-item__prepend > .v-icon),
.bistro-sidebar-mobile :deep(.v-list-item__append > .v-icon) {
  font-size: 26px;
}
.bistro-sidebar-mobile :deep(.sidebar-create-button) {
  min-height: 52px !important;
  font-size: 16px !important;
}
.bistro-sidebar-mobile :deep(.sidebar-create-button .v-icon) {
  font-size: 24px !important;
}
.bistro-sidebar-mobile .sidebar-user-name {
  font-size: 16px;
}
.bistro-sidebar-mobile .sidebar-user-avatar-link {
  min-height: 52px;
}
.bistro-sidebar-mobile .sidebar-icon-button,
.bistro-sidebar-mobile .bistro-navigation-toggle {
  min-width: 48px !important;
  width: 48px !important;
  height: 48px !important;
}
.bistro-sidebar-mobile .sidebar-icon-button :deep(.v-icon),
.bistro-sidebar-mobile .bistro-navigation-toggle :deep(.v-icon) {
  font-size: 26px;
}
</style>
