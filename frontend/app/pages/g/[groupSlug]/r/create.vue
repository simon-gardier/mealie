<template>
  <div>
    <v-container class="flex-column">
      <header class="recipe-create-header">
        <img src="/create_recipe.png" :alt="$t('recipe.recipe-creation')" class="recipe-create-artwork">
        <div class="recipe-create-method">
          <h1>{{ $t('recipe.recipe-creation') }}</h1>
          <p>{{ $t('recipe.editor.choose-creation-method') }}</p>
          <BaseOverflowButton v-model="subpage" :items="subpages" />
        </div>
      </header>
      <section>
        <NuxtPage />
      </section>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from "~/components/global/BaseOverflowButton.vue";
import { useGroupSelf } from "~/composables/use-groups";
import { readRecipeImportUrl, recipeImportUrlKey } from "~/composables/use-recipe-import-url";

definePageMeta({
  middleware: ["group-only"],
});

const i18n = useI18n();
const auth = useMealieAuth();
const { $globals } = useNuxtApp();
const { group } = useGroupSelf();

useSeoMeta({
  title: i18n.t("general.create"),
});

const subpages = computed<MenuItem[]>(() => [
  {
    icon: $globals.icons.link,
    text: i18n.t("recipe.import-with-url"),
    value: "url",
  },
  {
    icon: $globals.icons.link,
    text: i18n.t("recipe.bulk-url-import"),
    value: "bulk",
  },
  {
    icon: $globals.icons.codeTags,
    text: i18n.t("recipe.import-from-html-or-json"),
    value: "html",
  },
  {
    icon: $globals.icons.autoFix,
    text: i18n.t("recipe.import-with-ai"),
    value: "ai",
    hide: !group.value?.aiProviderSettings?.aiEnabled,
  },
  {
    icon: $globals.icons.edit,
    text: i18n.t("recipe.create-recipe"),
    value: "new",
  },
  {
    icon: $globals.icons.zip,
    text: i18n.t("recipe.import-with-zip"),
    value: "zip",
  },
  {
    icon: $globals.icons.robot,
    text: i18n.t("recipe.debug-scraper"),
    value: "debug",
  },
]);

const route = useRoute();
provide(recipeImportUrlKey, ref(readRecipeImportUrl(route.query)));
const router = useRouter();
const groupSlug = computed(() => route.params.groupSlug || auth.user.value?.groupSlug || "");

const subpage = computed({
  set(subpage: string) {
    router.push({ path: `/g/${groupSlug.value}/r/create/${subpage}`, query: route.query });
  },
  get() {
    return route.path.split("/").pop() ?? "url";
  },
});
</script>

<style scoped>
.recipe-create-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 720px;
  margin: 16px auto 24px;
}
.recipe-create-artwork {
  width: min(100%, 360px);
  height: auto;
}
.recipe-create-method {
  width: 100%;
}
.recipe-create-method h1 {
  font: 600 20px var(--bistro-body);
  margin-bottom: 8px;
}
.recipe-create-method p {
  font-size: 14px;
  color: rgba(var(--v-theme-text-secondary), 0.8);
  margin-bottom: 16px;
}
.recipe-create-method :deep(.v-btn) {
  min-height: 44px;
  border-radius: 10px;
  text-transform: none;
}
section {
  max-width: 720px;
  margin-inline: auto;
}
</style>
