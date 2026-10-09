<template>
  <div class="bulk-import-page">
    <div>
      <v-card-title class="bulk-import-heading">
        {{ $t('recipe.recipe-bulk-importer') }}
      </v-card-title>
      <v-card-text>
        {{ $t('recipe.editor.bulk-import-help') }}
      </v-card-text>
      <div class="px-4">
        <section class="bulk-import-form">
          <v-row v-for="(_, idx) in bulkUrls" :key="'bulk-url' + idx" class="bulk-url-row" density="compact">
            <v-col cols="12" xs="12" sm="12" md="12">
              <v-text-field
                v-model="bulkUrls[idx].url"
                class="bulk-url-input"
                :label="$t('new-recipe.recipe-url')"
                density="compact"
                style="--v-input-control-height: 60px"
                validate-on="blur"
                variant="filled"
                hide-details
                clearable
                :prepend-inner-icon="$globals.icons.link"
              >
                <template #append>
                  <v-btn
                    color="error"
                    :aria-label="$t('general.delete')"
                    icon
                    size="default"
                    variant="text"
                    @click="bulkUrls.splice(idx, 1)"
                  >
                    <v-icon size="large">
                      {{ $globals.icons.delete }}
                    </v-icon>
                  </v-btn>
                </template>
              </v-text-field>
            </v-col>
            <template v-if="state.showCatTags">
              <v-col cols="12" xs="12" sm="6" class="py-0">
                <RecipeOrganizerSelector
                  v-model="bulkUrls[idx].categories"
                  selector-type="categories"
                  :input-attrs="{ variant: 'filled', density: 'compact', hideDetails: true, clearable: true }"
                />
              </v-col>
              <v-col cols="12" xs="12" sm="6" class="pt-0 pb-4">
                <RecipeOrganizerSelector
                  v-model="bulkUrls[idx].tags"
                  selector-type="tags"
                  :input-attrs="{ variant: 'filled', density: 'compact', hideDetails: true, clearable: true }"
                />
              </v-col>
            </template>
          </v-row>
          <v-card-actions class="bulk-import-actions">
            <BaseButton
              class="bulk-clear-action"
              variant="text"
              :disabled="!bulkUrls.length"
              delete
              @click="
                bulkUrls = [];
                lockBulkImport = false;
              "
            >
              {{ $t('general.clear') }}
            </BaseButton>

            <BaseButton class="bulk-add-action" color="primary" variant="tonal" @click="bulkUrls.push({ url: '', categories: [], tags: [] })">
              <template #icon>
                {{ $globals.icons.createAlt }}
              </template>
              {{ $t('recipe.editor.add-url') }}
            </BaseButton>
            <RecipeDialogBulkAdd v-model="state.bulkDialog" class="bulk-add-wrapper" @bulk-data="assignUrls" />
          </v-card-actions>
          <div class="px-0">
            <v-checkbox v-model="state.showCatTags" hide-details :label="$t('recipe.set-categories-and-tags')" />
          </div>
          <v-card-actions class="bulk-submit-actions">
            <div class="bulk-submit-wrapper">
              <BaseButton
                :text="$t('recipe.editor.start-import')"
                :disabled="bulkUrls.length === 0 || lockBulkImport"
                variant="tonal"
                block
                @click="bulkCreate"
              >
                <template #icon>
                  {{ $globals.icons.check }}
                </template>
              </BaseButton>
            </div>
          </v-card-actions>
        </section>
        <section class="bulk-import-history">
          <BaseCardSectionTitle :title="$t('recipe.bulk-imports')" />
          <BaseEmptyState v-if="!reports.length" :message="$t('recipe.editor.no-bulk-imports')" :icon="$globals.icons.link" />
          <div v-else class="bulk-history-table">
            <ReportTable :items="reports" @delete="deleteReport" />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRecipeImportUrl } from "~/composables/use-recipe-import-url";
import { whenever } from "@vueuse/shared";
import { useUserApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";
import RecipeOrganizerSelector from "~/components/Domain/Recipe/RecipeOrganizerSelector.vue";
import type { ReportSummary } from "~/lib/api/types/reports";
import RecipeDialogBulkAdd from "~/components/Domain/Recipe/RecipeDialogBulkAdd.vue";

const state = reactive({
  showCatTags: false,
  bulkDialog: false,
});

whenever(
  () => !state.showCatTags,
  () => {
    console.log("showCatTags changed");
  },
);

const api = useUserApi();
const i18n = useI18n();

const recipeUrl = useRecipeImportUrl();
const bulkUrls = ref([{ url: recipeUrl.value || "", categories: [], tags: [] }]);
watch(() => bulkUrls.value[0]?.url, (url) => { recipeUrl.value = url || null; }, { flush: "sync" });
const lockBulkImport = ref(false);

async function bulkCreate() {
  if (bulkUrls.value.length === 0) {
    return;
  }

  const { response } = await api.recipes.createManyByUrl({ imports: bulkUrls.value });

  if (response?.status === 202) {
    alert.success(i18n.t("recipe.bulk-import-process-has-started"));
    lockBulkImport.value = true;
  }
  else {
    alert.error(i18n.t("recipe.bulk-import-process-has-failed"));
  }

  fetchReports();
}

// =========================================================
// Reports

const reports = ref<ReportSummary[]>([]);

async function fetchReports() {
  const { data } = await api.groupReports.getAll("bulk_import");
  reports.value = data ?? [];
}

async function deleteReport(id: string) {
  console.log(id);
  const { response } = await api.groupReports.deleteOne(id);

  if (response?.status === 200) {
    fetchReports();
  }
  else {
    alert.error(i18n.t("recipe.report-deletion-failed"));
  }
}

fetchReports();

function assignUrls(urls: string[]) {
  if (urls.length === 0) {
    return;
  }

  bulkUrls.value = urls.map(url => ({ url, categories: [], tags: [] }));
}
</script>

<style scoped>
.bulk-import-heading {
  font: 600 18px var(--bistro-body);
  white-space: normal;
  padding: 0 0 12px;
}
.bulk-import-page > div > .v-card-text {
  padding: 0 0 20px;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(var(--v-theme-text-secondary), var(--v-secondary-label-opacity));
}
.bulk-import-page > div > .px-4 {
  padding-inline: 0 !important;
}
.bulk-import-form {
  padding: 16px;
  border: 1px solid rgba(var(--v-theme-separator), 0.5);
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
}
.bulk-url-row {
  margin: 0 0 12px;
}
.bulk-url-row > .v-col {
  padding: 0 0 12px;
}
.bulk-import-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 0 12px;
}
.bulk-import-actions :deep(.bulk-add-action),
.bulk-import-actions :deep(.bulk-add-trigger) {
  width: 100% !important;
  height: 44px;
  margin: 0;
}
.bulk-add-wrapper {
  display: flex;
  align-items: stretch;
}
.bulk-import-actions > :not(.bulk-clear-action) {
  flex: 1 1 0;
  min-width: 0;
}
.bulk-clear-action {
  margin-left: auto;
  order: 3;
}
.bulk-import-form :deep(.v-btn) {
  min-height: 44px;
  border-radius: 10px;
  text-transform: none;
  letter-spacing: normal;
}
.bulk-import-form :deep(.v-btn__content) {
  white-space: normal;
}
.bulk-submit-actions {
  padding: 16px 0 0;
  border-top: 1px solid rgba(var(--v-theme-separator), 0.5);
  margin-top: 12px;
}
.bulk-submit-wrapper {
  width: 100%;
}
.bulk-import-history {
  margin-top: 32px;
}
.bulk-history-table {
  border-radius: 14px;
  overflow-x: auto;
}
@media (max-width: 599px) {
  .bulk-import-actions > :not(.bulk-clear-action) {
    flex: 1 1 100%;
    margin: 0 !important;
  }
}
</style>
