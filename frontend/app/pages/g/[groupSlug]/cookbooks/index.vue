<template>
  <div>
    <!-- Create Dialog -->
    <BaseDialog
      v-if="createTarget"
      v-model="dialogStates.create"
      width="100%"
      max-width="960px"
      content-class="cookbook-create-dialog"
      :icon="$globals.icons.pages"
      :title="$t('cookbook.create-a-cookbook')"
      :submit-icon="$globals.icons.create"
      :submit-text="$t('cookbook.create-button')"
      :submit-disabled="!createTarget.queryFilterString || !createTarget.name?.trim()"
      :loading="savingCookbook"
      :persistent="savingCookbook"
      keep-open
      disable-submit-on-enter
      @submit="saveCreatedCookbook"
      @cancel="deleteCreateTarget()"
    >
      <CookbookEditor :key="createTargetKey" v-model="createTarget" :inert="savingCookbook" :aria-busy="savingCookbook" />
      <template #card-actions>
        <v-btn variant="text" :disabled="savingCookbook" @click="deleteCreateTarget">
          {{ $t('general.cancel') }}
        </v-btn>
        <v-spacer />
        <BaseButton
          create
          color="primary"
          variant="tonal"
          height="44"
          :loading="savingCookbook"
          :disabled="savingCookbook || !createTarget.name.trim() || !createTarget.queryFilterString"
          :text="$t('cookbook.create-button')"
          @click="saveCreatedCookbook"
        />
      </template>
    </BaseDialog>

    <!-- Delete Dialog -->
    <BaseDialog
      v-model="dialogStates.delete"
      bottom-sheet
      :title="$t('general.delete-with-name', { name: $t('cookbook.cookbook') })"
      :icon="$globals.icons.alertCircle"
      color="error"
      can-confirm
      @confirm="deleteCookbook()"
    >
      <v-card-text>
        <p>{{ $t("general.confirm-delete-generic-with-name", { name: $t("cookbook.cookbook") }) }}</p>
        <p v-if="deleteTarget" class="mt-4 ml-4">
          {{ deleteTarget.name }}
        </p>
      </v-card-text>
    </BaseDialog>

    <!-- Cookbook Page -->
    <!-- Page Title -->
    <v-container class="lg-container cookbook-list-page">
      <BasePageTitle title-image="/cookbooks.png" :title-image-alt="$t('cookbook.cookbooks')">
        <template #title>
          {{ $t("cookbook.cookbooks") }}
        </template>
        <span class="cookbook-list-intro">{{ $t("cookbook.list-description") }}</span>
      </BasePageTitle>

      <div class="cookbook-preferences">
        <v-checkbox
          v-model="cookbookPreferences.hideOtherHouseholds"
          :label="$t('cookbook.hide-cookbooks-from-other-households')"
          :hint="$t('cookbook.hide-cookbooks-from-other-households-description')"
          persistent-hint
          color="primary"
        />
      </div>

      <!-- Create New -->
      <div class="cookbook-list-toolbar">
        <p class="cookbook-order-hint">
          {{ $t('cookbook.reorder-help') }}
        </p>
        <BaseButton
          create
          color="primary"
          variant="tonal"
          height="44"
          :text="$t('cookbook.create-button')"
          @click="createCookbook"
        />
      </div>

      <BaseEmptyState v-if="!myCookbooks.length" :icon="$globals.icons.pages" :message="$t('cookbook.empty-list')" />

      <!-- Cookbook List -->
      <v-expansion-panels v-model="openedCookbook" class="cookbook-list" variant="accordion">
        <VueDraggable
          v-model="myCookbooks"
          handle=".cookbook-drag-handle"
          :delay="250"
          :delay-on-touch-only="true"
          :animation="180"
          :touch-start-threshold="5"
          ghost-class="cookbook-drop-target"
          chosen-class="cookbook-drag-chosen"
          drag-class="cookbook-drag-active"
          style="width: 100%"
          @end="updateAll(myCookbooks)"
        >
          <v-expansion-panel
            v-for="(cookbook, index) in myCookbooks"
            :key="cookbook.id"
            :value="cookbook.id"
            class="cookbook-list-card"
          >
            <div class="cookbook-list-card-header">
              <div class="cookbook-list-title">
                <v-icon :icon="$globals.icons.pages" size="22" class="cookbook-list-icon" />
                <span class="cookbook-list-name">{{ cookbook.name }}</span>
              </div>
              <v-btn
                class="cookbook-edit-button"
                icon
                variant="text"
                color="primary"
                :aria-label="$t('cookbook.edit-named', { name: cookbook.name })"
                :aria-expanded="openedCookbook === cookbook.id"
                @click.stop="openedCookbook = openedCookbook === cookbook.id ? null : cookbook.id"
              >
                <v-icon :icon="$globals.icons.edit" size="20" />
              </v-btn>
              <v-btn
                class="cookbook-drag-handle"
                icon
                variant="text"
                color="text-secondary"
                :aria-label="$t('cookbook.drag-to-reorder')"
                @click.stop
                @keydown.up.prevent="moveCookbook(index, -1)"
                @keydown.down.prevent="moveCookbook(index, 1)"
              >
                <v-icon :icon="$globals.icons.arrowUpDown" size="20" />
              </v-btn>
            </div>
            <v-expansion-panel-text>
              <CookbookEditor :model-value="cookbook" :collapsable="false" @update:model-value="myCookbooks[index] = $event" />
              <v-card-actions>
                <v-spacer />
                <BaseButtonGroup
                  :buttons="[
                    {
                      icon: $globals.icons.delete,
                      text: $t('general.delete'),
                      event: 'delete',
                    },
                    {
                      icon: $globals.icons.save,
                      text: $t('general.save'),
                      event: 'save',
                      disabled: !cookbook.queryFilterString,
                    },
                  ]"
                  @delete="deleteEventHandler(cookbook)"
                  @save="actions.updateOne(cookbook)"
                />
              </v-card-actions>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </VueDraggable>
      </v-expansion-panels>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";
import { useCookbookStore } from "~/composables/store/use-cookbook-store";
import { useHouseholdSelf } from "@/composables/use-households";
import CookbookEditor from "~/components/Domain/Cookbook/CookbookEditor.vue";
import { useUserApi } from "~/composables/api";
import type { ReadCookBook } from "~/lib/api/types/cookbook";
import { useCookbookPreferences } from "~/composables/use-users/preferences";

definePageMeta({
  middleware: ["group-only"],
});

const dialogStates = reactive({
  create: false,
  delete: false,
});

const i18n = useI18n();

// Set page title
useSeoMeta({
  title: i18n.t("cookbook.cookbooks"),
});

const auth = useMealieAuth();
const { store: allCookbooks, actions, updateAll } = useCookbookStore();

// Make a local reactive copy of myCookbooks
const myCookbooks = ref<ReadCookBook[]>([]);
const openedCookbook = ref<string | null>(null);
watch(
  allCookbooks,
  (cookbooks) => {
    myCookbooks.value
      = cookbooks?.filter(
        cookbook => cookbook.householdId === auth.user.value?.householdId,
      ).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) ?? [];
  },
  { immediate: true },
);

const { household } = useHouseholdSelf();
const cookbookPreferences = useCookbookPreferences();

const cookbookApi = useUserApi();
const { draft: createTarget, saving: savingCookbook, open: openCookbookDraft, cancel: cancelCookbookDraft, save: saveCookbookDraft } = useCookbookCreation(async (draft) => {
  const { data } = await cookbookApi.cookbooks.createOne(draft);
  if (data) allCookbooks.value = [...allCookbooks.value, data];
  return data;
});
// create
async function saveCreatedCookbook() {
  if (await saveCookbookDraft()) dialogStates.create = false;
}
const createTargetKey = ref(0);

function createCookbook() {
  const name = i18n.t("cookbook.household-cookbook-name", [
    household.value?.name || "",
    String((myCookbooks.value?.length ?? 0) + 1),
  ]) as string;

  openCookbookDraft(name);
  createTargetKey.value++;
  dialogStates.create = true;
}

// delete
const deleteTarget = ref<ReadCookBook | null>(null);
function deleteEventHandler(item: ReadCookBook) {
  deleteTarget.value = item;
  dialogStates.delete = true;
}
async function deleteCookbook() {
  if (!deleteTarget.value) {
    return;
  }
  await actions.deleteOne(deleteTarget.value.id);
  myCookbooks.value = myCookbooks.value.filter(c => c.id !== deleteTarget.value?.id);
  dialogStates.delete = false;
  deleteTarget.value = null;
}

function deleteCreateTarget() {
  if (savingCookbook.value) return;
  dialogStates.create = false;
  cancelCookbookDraft();
}

function moveCookbook(index: number, offset: number) {
  const destination = index + offset;
  if (destination < 0 || destination >= myCookbooks.value.length) return;
  const reordered = [...myCookbooks.value];
  const [cookbook] = reordered.splice(index, 1);
  reordered.splice(destination, 0, cookbook!);
  myCookbooks.value = reordered;
  void updateAll(reordered);
}
</script>

<style scoped>
.cookbook-list-page {
  padding-bottom: 32px;
}
.cookbook-list-intro,
.cookbook-order-hint {
  font-family: var(--bistro-body);
  color: rgb(var(--v-theme-text-secondary));
  font-size: 14px;
  line-height: 1.5;
}
.cookbook-list-intro {
  display: block;
  max-width: 640px;
  margin: 16px auto 0;
  text-align: center;
}
.cookbook-preferences {
  margin-block: 24px;
  padding: 12px 16px;
  border: 1px solid rgba(var(--v-theme-separator), 0.45);
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  font-family: var(--bistro-body);
}
.cookbook-preferences :deep(.v-label) {
  font-size: 15px;
  opacity: 1;
}
.cookbook-preferences :deep(.v-messages) {
  font-size: 13px;
  line-height: 1.5;
}
.cookbook-list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}
.cookbook-order-hint {
  margin: 0;
}
.cookbook-list-toolbar :deep(.v-btn) {
  border-radius: 10px;
  text-transform: none;
  white-space: normal;
}
.cookbook-list-card.v-expansion-panel {
  margin: 0 0 12px;
  border: 1px solid rgba(var(--v-theme-separator), 0.45);
  border-radius: 14px !important;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}
.cookbook-list-card :deep(.v-expansion-panel__shadow),
.cookbook-list-card::after {
  display: none;
}
.cookbook-list-card-header {
  display: flex;
  align-items: center;
  padding-inline-end: 12px;
  gap: 8px;
}
.cookbook-list-title {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  min-height: 72px;
  padding: 16px;
  gap: 12px;
  border-radius: 14px;
  font-family: var(--bistro-body);
  font-size: 16px;
  font-weight: 600;
}
.cookbook-list-icon {
  color: rgb(var(--v-theme-text-secondary));
  flex-shrink: 0;
}
.cookbook-list-name {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.cookbook-edit-button,
.cookbook-drag-handle {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  border-radius: 10px;
}
.cookbook-drag-handle {
  cursor: grab;
  touch-action: none;
}
.cookbook-drag-handle:active {
  cursor: grabbing;
}
.cookbook-drag-handle:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
.cookbook-list-card.cookbook-drop-target {
  outline: 2px dashed rgb(var(--v-theme-primary));
  outline-offset: -2px;
  border-color: transparent;
  background: rgba(var(--v-theme-primary), 0.12);
}
.cookbook-list-card.cookbook-drag-chosen:not(.cookbook-drop-target),
.cookbook-list-card.cookbook-drag-active:not(.cookbook-drop-target) {
  border-radius: 14px !important;
  background: rgb(var(--v-theme-surface-elevated));
  opacity: 1;
}
@media (max-width: 600px) {
  .cookbook-preferences {
    padding: 8px;
  }
  .cookbook-list-title {
    padding: 12px;
  }
}
</style>

<style>
.cookbook-create-dialog .base-dialog-card .dialog-title {
  font-family: var(--bistro-body) !important;
  letter-spacing: normal;
}
.cookbook-create-dialog .base-dialog-card > .v-card-actions .v-btn {
  min-height: 44px;
  border-radius: 10px;
  text-transform: none;
  white-space: normal;
}
</style>
