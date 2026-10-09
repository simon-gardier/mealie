<template>
  <v-toolbar ref="header" color="surface" :elevation="0" class="bistro-header d-print-none">
    <slot />
    <RouterLink :to="routerLink" class="bistro-wordmark">
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
    <RecipeDialogSearch ref="domSearchDialog" />
  </v-toolbar>
</template>

<script setup lang="ts">
import { useResizeObserver } from "@vueuse/core";
import type RecipeDialogSearch from "~/components/Domain/Recipe/RecipeDialogSearch.vue";

defineProps({
  menu: {
    type: Boolean,
    default: true,
  },
});
const header = ref<{ $el: HTMLElement } | null>(null);
function updateHeaderOffset() {
  const element = header.value?.$el;
  element?.closest<HTMLElement>(".v-application")?.style.setProperty(
    "--bistro-header-bottom", `${element.getBoundingClientRect().bottom}px`,
  );
}
useResizeObserver(computed(() => header.value?.$el), updateHeaderOffset);
onMounted(updateHeaderOffset);

const auth = useMealieAuth();
const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");

const routerLink = computed(() => groupSlug.value ? `/g/${groupSlug.value}` : "/");
const domSearchDialog = ref<InstanceType<typeof RecipeDialogSearch> | null>(null);

function activateSearch() {
  domSearchDialog.value?.open();
}

function handleKeyEvent(e: KeyboardEvent) {
  const activeTag = document.activeElement?.tagName;
  if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey
    && activeTag !== "INPUT" && activeTag !== "TEXTAREA"
    && !(document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable)) {
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
</script>

<style scoped>
.remy-logo {
  object-fit: contain;
  width: 48px;
  height: 48px;
}

.bistro-header.v-toolbar {
  position: fixed;
  top: 12px;
  left: 12px;
  width: max-content;
  max-width: calc(100vw - 24px);
  padding-inline: 8px;
  border: 1px solid rgba(var(--v-theme-separator), 0.6);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(var(--v-theme-shadow), 0.1);
}

.bistro-header :deep(.v-toolbar__content) {
  width: auto;
}

.bistro-header .bistro-wordmark {
  color: rgb(var(--v-theme-text-primary));
}

.v-toolbar {
  z-index: 1000 !important;
}
</style>
