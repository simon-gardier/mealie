<template>
  <v-container v-if="shoppingList" class="md-container">
    <BaseDialog
      v-model="state.checkAllDialog"
      bottom-sheet
      :title="$t('general.confirm')"
      :icon="$globals.icons.checkboxMultipleMarkedOutline"
      can-confirm
      @confirm="checkAll"
    >
      <v-card-text>
        {{ $t('shopping-list.are-you-sure-you-want-to-check-all-items') }}
      </v-card-text>
    </BaseDialog>

    <BaseDialog
      v-model="state.uncheckAllDialog"
      bottom-sheet
      :title="$t('general.confirm')"
      :icon="$globals.icons.checkboxMultipleBlankOutline"
      can-confirm
      @confirm="uncheckAll"
    >
      <v-card-text>
        {{ $t('shopping-list.are-you-sure-you-want-to-uncheck-all-items') }}
      </v-card-text>
    </BaseDialog>

    <BaseDialog
      v-model="state.deleteCheckedDialog"
      bottom-sheet
      :title="$t('general.confirm')"
      :icon="$globals.icons.alertCircle"
      can-confirm
      @confirm="deleteChecked"
    >
      <v-card-text>
        {{ $t('shopping-list.are-you-sure-you-want-to-delete-checked-items') }}
      </v-card-text>
    </BaseDialog>

    <BaseDialog
      v-model="ownerDialog"
      bottom-sheet
      :icon="$globals.icons.admin"
      :title="$t('user.edit-user')"
      can-confirm
      @confirm="updateOwner"
    >
      <v-container>
        <v-form>
          <v-select
            v-model="updateUserId"
            :items="allUsers"
            item-title="fullName"
            item-value="id"
            :label="$t('general.owner')"
          >
            <template #prepend>
              <UserAvatar v-if="updateUserId" :user-id="updateUserId" :tooltip="false" />
            </template>
          </v-select>
        </v-form>
      </v-container>
    </BaseDialog>

    <!-- Reorder Labels -->
    <BaseDialog
      v-model="reorderLabelsDialog"
      :icon="$globals.icons.tagArrowUp"
      content-class="shopping-tags-reorder-dialog"
      :title="$t('shopping-list.reorder-labels')"
      :submit-icon="$globals.icons.save"
      :submit-text="$t('general.save')"
      can-submit
      @submit="saveLabelOrder"
      @close="cancelLabelOrder"
    >
      <div class="shopping-tags-reorder-body">
        <VueDraggable
          v-if="localLabels"
          v-model="localLabels"
          handle=".handle"
          :delay="250"
          :delay-on-touch-only="true"
          class="shopping-tags-reorder-list"
          ghost-class="recipe-drop-target"
          chosen-class="recipe-drag-chosen"
          drag-class="recipe-drag-active"
          :animation="180"
          @update:model-value="updateLabelOrder"
        >
          <div v-for="(labelSetting, index) in localLabels" :key="labelSetting.id" class="shopping-tag-reorder-row">
            <MultiPurposeLabelSection :model-value="labelSetting" use-color @update:model-value="localLabels[index] = $event" />
          </div>
        </VueDraggable>
      </div>
    </BaseDialog>

    <header class="shopping-details-header">
      <ButtonLink :to="`/shopping-lists?disableRedirect=true`" :text="$t('shopping-list.all-lists')" :icon="$globals.icons.backArrow" />
      <div class="shopping-details-heading">
        <h1>{{ shoppingList.name }}</h1>
        <BaseButtonGroup
          class="d-flex"
          rounded
          :buttons="[
            {
              icon: $globals.icons.contentCopy,
              text: ('general.actions'),
              event: 'edit',
              children: [
                {
                  icon: $globals.icons.contentCopy,
                  text: $t('shopping-list.copy-as-text'),
                  event: 'copy-plain',
                },
                {
                  icon: $globals.icons.contentCopy,
                  text: $t('shopping-list.copy-as-markdown'),
                  event: 'copy-markdown',
                },
              ],
            },
            {
              icon: $globals.icons.checkboxMultipleMarkedOutline,
              text: $t('shopping-list.check-all-items'),
              event: 'check',
            },
            {
              icon: $globals.icons.dotsVertical,
              text: ('general.actions'),
              event: 'three-dot',
              children: [
                {
                  icon: $globals.icons.tags,
                  text: $t('shopping-list.reorder-labels'),
                  event: 'reorder-labels',
                },
                {
                  icon: $globals.icons.tags,
                  text: $t('shopping-list.manage-labels'),
                  event: 'manage-labels',
                },
                {
                  icon: $globals.icons.user,
                  text: $t('general.change-owner'),
                  event: 'change-owner',
                },
              ],
            },
          ]"
          @edit="edit = true"
          @three-dot="threeDot = true"
          @check="openCheckAll"
          @copy-plain="copyListItems('plain')"
          @copy-markdown="copyListItems('markdown')"
          @reorder-labels="toggleReorderLabelsDialog()"
          @manage-labels="$router.push(`/group/data/labels`)"
          @change-owner="openOwnerDialog"
        />
      </div>
    </header>
    <BannerWarning
      v-if="isOffline"
      :title="$t('shopping-list.you-are-offline')"
      :description="$t('shopping-list.you-are-offline-description')"
    />

    <div v-if="totalItemCount" class="shopping-list-progress" role="status">
      <div class="d-flex align-center justify-space-between ga-3 mb-2">
        <span>{{ $t('shopping-list.items-checked-count', checkedItemCount) }}</span><span>{{ checkedItemCount }} / {{ totalItemCount }}</span>
      </div>
      <v-progress-linear
        :model-value="completionPercentage"
        color="primary"
        bg-color="separator"
        :bg-opacity="1"
        buffer-color="separator"
        :buffer-opacity="1"
        height="4"
        rounded
        :aria-label="$t('shopping-list.items-checked-count', checkedItemCount)"
      />
    </div>

    <!-- Viewer -->
    <section v-if="!edit" class="py-2 d-flex flex-column ga-1 shopping-list-view recipe-editor-overlay">
      <!-- Create Item -->
      <ShoppingListAddItemForm
        v-if="$vuetify.display.smAndDown"
        v-model="createListItemData"
        class="my-4"
        :labels="allLabels || []"
        :units="allUnits || []"
        :foods="allFoods || []"
        @cancel="createEditorOpen = false"
        @save="createListItem"
      />

      <div v-else class="mb-3 d-flex justify-center">
        <ShoppingListItemEditor
          v-if="createEditorOpen"
          v-model="createListItemData"
          class="my-4"
          :labels="allLabels || []"
          :units="allUnits || []"
          :foods="allFoods || []"
          :allow-delete="false"
          @delete="createEditorOpen = false"
          @cancel="createEditorOpen = false"
          @save="createListItem"
        />
        <BaseButton
          v-else
          create
          small
          :text="$t('shopping-list.add-item')"
          style="height: 48px"
          @click="createEditorOpen = true"
        />
      </div>

      <BaseEmptyState v-if="!totalItemCount" :message="$t('shopping-list.empty-list')" :icon="$globals.icons.cartCheck" />
      <TransitionGroup name="scroll-x-transition">
        <BaseExpansionPanels v-for="(value, key) in itemsByLabel" :key="key" :v-model="0" start-open>
          <v-expansion-panel class="shopping-list-section">
            <!-- the label colour fills the header bar; an uncoloured (or unlabelled) header is muted instead -->
            <v-expansion-panel-title
              color="surface"
              class="body-1 section-title"
            >
              <span class="shopping-label-dot" :style="{ backgroundColor: value[0]?.label?.color || getLabelColor(key) || 'rgb(var(--v-theme-separator))' }" aria-hidden="true" />
              <span class="section-heading-content">
                <span class="section-label">{{ key }}</span>
                <span class="section-count">{{ $t('shopping-list.products-count', value.length) }}</span>
              </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text eager>
              <VueDraggable
                :model-value="value"
                handle=".handle"
                :delay="250"
                :delay-on-touch-only="true"
                ghost-class="recipe-drop-target"
                chosen-class="recipe-drag-chosen"
                drag-class="recipe-drag-active"
                fallback-class="shopping-item-drag-preview"
                :force-fallback="true"
                :fallback-on-body="false"
                :animation="180"
                @start="loadingCounter += 1"
                @end="loadingCounter -= 1"
                @update:model-value="updateIndexUncheckedByLabel(key.toString(), $event)"
              >
                <TransitionGroup name="scroll-x-transition">
                  <ShoppingListItem
                    v-for="(item, index) in value"
                    :key="item.id"
                    :model-value="item"
                    class="my-2 w-auto shopping-list-item-row"
                    :edit="editingItem === item.id"
                    :labels="allLabels || []"
                    :units="allUnits || []"
                    :foods="allFoods || []"
                    :recipes="recipeMap"
                    @update:model-value="value[index] = $event"
                    @checked="(item) => {
                      saveListItem(item);
                      itemCheckedToast(item);
                    }"
                    @save="(item) => {
                      editingItem = undefined;
                      saveListItem(item);
                    }"
                    @delete="deleteListItem(item)"
                    @view="editingItem = undefined"
                    @edit="editingItem = item.id"
                  />
                </TransitionGroup>
              </VueDraggable>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </BaseExpansionPanels>
      </TransitionGroup>
      <!-- Checked Items -->
      <v-expansion-panels flat rounded>
        <v-expansion-panel
          v-if="listItems.checked && listItems.checked.length > 0"
          class="shopping-list-checked-section"
        >
          <v-expansion-panel-title class="shopping-checked-header">
            <div class="d-flex align-center flex-0-1-100">
              <div class="flex-1-0">
                {{ $t('shopping-list.items-checked-count', listItems.checked ? listItems.checked.length : 0) }}
              </div>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text eager>
            <div class="shopping-checked-actions">
              <v-btn variant="tonal" color="primary" :prepend-icon="$globals.icons.checkboxMultipleBlankOutline" @click="openUncheckAll">
                {{ $t('shopping-list.uncheck-all-items') }}
              </v-btn>
              <v-btn variant="text" color="error" :prepend-icon="$globals.icons.delete" @click="openDeleteChecked">
                {{ $t('shopping-list.delete-checked') }}
              </v-btn>
            </div>
            <TransitionGroup name="scroll-x-transition">
              <div v-for="(item, idx) in listItems.checked" :key="item.id">
                <ShoppingListItem
                  :model-value="item"
                  class="shopping-list-item-row"
                  :labels="allLabels || []"
                  :units="allUnits || []"
                  :foods="allFoods || []"
                  @update:model-value="listItems.checked[idx] = $event"
                  @checked="saveListItem"
                  @save="saveListItem"
                  @delete="deleteListItem(item)"
                />
              </div>
            </TransitionGroup>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </section>

    <!-- Recipe References -->
    <v-lazy v-if="shoppingList.recipeReferences && shoppingList.recipeReferences.length > 0" class="mt-6">
      <section>
        <div class="d-flex align-center">
          <span>
            <v-icon start class="mb-1">
              {{ $globals.icons.silverwareForkKnife }}
            </v-icon>
          </span>
          <span>{{ $t('shopping-list.linked-recipes-count', shoppingList.recipeReferences
            ? shoppingList.recipeReferences.length
            : 0) }}</span>
          <v-tooltip location="top">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-bind="tooltipProps"
                icon
                variant="text"
                size="44"
                class="linked-recipes-info ms-1"
                color="primary"
                :aria-label="$t('shopping-list.linked-recipes-quantity-info')"
              >
                <v-icon size="24">
                  {{ $globals.icons.information }}
                </v-icon>
              </v-btn>
            </template>
            <span>{{ $t('shopping-list.linked-recipes-quantity-info') }}</span>
          </v-tooltip>
        </div>
        <v-divider />
        <div class="shopping-list-linked-recipes mt-3">
          <v-sheet v-for="recipe in recipeList" :key="recipe.id ?? recipe.slug" class="linked-recipe-card">
            <RecipeCardLineItem :recipe="recipe" :disable-link="isOffline" />
            <div class="linked-recipe-controls">
              <RecipeScaleEditButton
                :model-value="linkedPortions(recipe) / (recipe.recipeServings || 1)"
                :recipe-servings="recipe.recipeServings || 1"
                :edit-scale="!isOffline"
                @update:model-value="changeLinkedPortions(recipe, $event * (recipe.recipeServings || 1) - linkedPortions(recipe))"
              />
            </div>
          </v-sheet>
        </div>
      </section>
    </v-lazy>
  </v-container>
</template>

<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";
import RecipeCardLineItem from "~/components/Domain/Recipe/RecipeCardLineItem.vue";
import RecipeScaleEditButton from "~/components/Domain/Recipe/RecipeScaleEditButton.vue";
import MultiPurposeLabelSection from "~/components/Domain/ShoppingList/MultiPurposeLabelSection.vue";
import ShoppingListAddItemForm from "~/components/Domain/ShoppingList/ShoppingListAddItemForm.vue";
import ShoppingListItem from "~/components/Domain/ShoppingList/ShoppingListItem.vue";
import ShoppingListItemEditor from "~/components/Domain/ShoppingList/ShoppingListItemEditor.vue";
import UserAvatar from "~/components/Domain/User/UserAvatar.vue";
import { useAmbianceMusic } from "~/composables/use-ambiance-music";
import { useShoppingListPage } from "~/composables/shopping-list-page/use-shopping-list-page";
import { useLabelStore, useUnitStore, useFoodStore } from "~/composables/store";
import { useUserApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";
import type { ShoppingListItemOut } from "~/lib/api/types/household";
import type { UserOut } from "~/lib/api/types/user";

const i18n = useI18n();
const totalItemCount = computed(() => shoppingList.value?.listItems?.length ?? 0);
const checkedItemCount = computed(() => listItems.checked.length);
const completionPercentage = computed(() => totalItemCount.value
  ? checkedItemCount.value / totalItemCount.value * 100
  : 0);

useSeoMeta({
  title: i18n.t("shopping-list.shopping-list"),
});

const route = useRoute();
const id = route.params.id as string;

const editingItem = ref<string | undefined>(undefined);
const shoppingListPage = useShoppingListPage(id);
const userApi = useUserApi();
const ownerDialog = ref(false);
const allUsers = ref<UserOut[]>([]);
const updateUserId = ref<string | undefined>();
const { store: allLabels } = useLabelStore();
const { store: allUnits } = useUnitStore();
const { store: allFoods } = useFoodStore();

async function openOwnerDialog() {
  const { data } = await userApi.households.fetchMembers();
  if (!data || !shoppingList.value) {
    return;
  }

  allUsers.value = data.items.sort((a, b) => ((a.fullName || "") < (b.fullName || "") ? -1 : 1));
  updateUserId.value = shoppingList.value.userId;
  ownerDialog.value = true;
}

async function updateOwner() {
  if (!shoppingList.value || !updateUserId.value || shoppingList.value.userId === updateUserId.value) {
    ownerDialog.value = false;
    return;
  }

  const { data: fullList } = await userApi.shopping.lists.getOne(shoppingList.value.id);
  if (!fullList) {
    return;
  }

  const { data } = await userApi.shopping.lists.updateOne(
    shoppingList.value.id,
    { ...fullList, userId: updateUserId.value },
  );

  if (data) {
    ownerDialog.value = false;
    refresh();
  }
}

function itemCheckedToast(item: ShoppingListItemOut) {
  setTimeout(() => {
    alert.info(
      i18n.t("shopping-list.item-checked-off", { item: item.food?.name || item.note || i18n.t("recipe.ingredient") }),
      undefined,
      {
        timeout: 4000,
        action: {
          message: i18n.t("general.undo"),
          onClick: () => {
            item.checked = false;
            shoppingListPage.saveListItem(item);
          },
        },
      },
    );
  }, 500);
}

const {
  shoppingList,
  state,
  checkAll,
  uncheckAll,
  deleteChecked,
  reorderLabelsDialog,
  localLabels,
  saveLabelOrder,
  cancelLabelOrder,
  updateLabelOrder,
  edit,
  threeDot,
  openCheckAll,
  copyListItems,
  toggleReorderLabelsDialog,
  isOffline,
  createEditorOpen,
  createListItemData,
  createListItem,
  itemsByLabel,
  getLabelColor,
  loadingCounter,
  updateIndexUncheckedByLabel,
  recipeMap,
  saveListItem,
  deleteListItem,
  listItems,
  openUncheckAll,
  openDeleteChecked,
  recipeList,
  removeRecipeReferenceToList,
  addRecipeReferenceToList,
  refresh,
} = shoppingListPage;

const portionTargets = reactive<Record<string, number>>({});
const portionTimers = new Map<string, ReturnType<typeof setTimeout>>();
let portionsSaving = false;
function linkedPortions(recipe: { id?: string | null; recipeServings?: number }) {
  const scale = shoppingList.value?.recipeReferences?.find(ref => ref.recipeId === recipe.id)?.recipeQuantity || 0;
  return portionTargets[recipe.id!] ?? Math.round(scale * (recipe.recipeServings || 1) * 100) / 100;
}
function changeLinkedPortions(recipe: { id?: string | null; recipeServings?: number }, delta: number) {
  const id = recipe.id!;
  portionTargets[id] = Math.max(1, linkedPortions(recipe) + delta);
  clearTimeout(portionTimers.get(id));
  portionTimers.set(id, setTimeout(() => { void saveLinkedPortions(); }, 250));
}
async function saveLinkedPortions() {
  if (portionsSaving) return;
  portionsSaving = true;
  try {
    while (Object.keys(portionTargets).length) {
      const id = Object.keys(portionTargets)[0];
      if (!id) break;
      const recipe = recipeList.value.find(recipe => recipe.id === id);
      if (!recipe) { Reflect.deleteProperty(portionTargets, id); continue; }
      const base = recipe.recipeServings || 1;
      const current = (shoppingList.value?.recipeReferences?.find(ref => ref.recipeId === id)?.recipeQuantity || 0) * base;
      const target = portionTargets[id];
      if (target == null || !Number.isFinite(target)) {
        Reflect.deleteProperty(portionTargets, id);
        continue;
      }
      const delta = (target - current) / base;
      if (Math.abs(delta) < 0.00001) { Reflect.deleteProperty(portionTargets, id); continue; }
      if (delta > 0) await addRecipeReferenceToList(id, delta);
      else await removeRecipeReferenceToList(id, -delta);
      const updated = (shoppingList.value?.recipeReferences?.find(ref => ref.recipeId === id)?.recipeQuantity || 0) * base;
      if (Math.abs(updated - current) < 0.00001) throw new Error("Portion update failed");
      if (portionTargets[id] === target) Reflect.deleteProperty(portionTargets, id);
    }
  }
  catch {
    Object.keys(portionTargets).forEach(id => Reflect.deleteProperty(portionTargets, id));
    alert.error(i18n.t("shopping-list.portions-update-failed"));
  }
  finally { portionsSaving = false; }
}
onBeforeUnmount(() => portionTimers.forEach(timer => clearTimeout(timer)));
useAmbianceMusic(() => Boolean(shoppingList.value), "assets/Souped_Up_-_Michael_Giacchino-list.mp3");
</script>

<style>
.number-input-container {
  max-width: 50px;
}

/* The page header reserves room for an icon row, a subtitle and generous margins; pull
   those in so the list starts near the top of the screen */
.shopping-list-title {
  margin-top: 0 !important;

  .v-container {
    padding-top: 4px;
    padding-bottom: 0;
  }

  h2 {
    font-size: 1.1rem !important;
    line-height: 1.4;
  }

  h3 {
    display: none;
  }

  .v-divider {
    margin-top: 6px !important;
    margin-bottom: 2px !important;
  }
}

.shopping-details-header {
  margin-bottom: 24px;
}
.shopping-details-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}
.shopping-details-heading h1 {
  font: 600 26px var(--bistro-heading);
  overflow-wrap: anywhere;
}
.shopping-label-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
  margin-right: 10px;
}
.shopping-list-view .shopping-list-section {
  border: 1px solid rgba(var(--v-theme-separator), 0.5);
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 12px;
}
.shopping-list-view .shopping-list-section .section-title {
  min-height: 52px;
  padding: 12px 16px;
  color: rgb(var(--v-theme-on-surface));
  font-size: 16px;
  font-weight: 600;
}
.shopping-list-view .section-heading-content {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  min-width: 0;
  flex: 1;
}
.shopping-list-view .section-label {
  overflow-wrap: anywhere;
}
.shopping-list-view .section-count {
  white-space: nowrap;
  font-size: 13px;
  font-weight: 400;
  color: rgb(var(--v-theme-text-secondary));
}
.shopping-list-view .v-expansion-panel-text__wrapper {
  padding: 4px 12px 12px;
  background: rgb(var(--v-theme-surface));
}
.shopping-list-view .shopping-list-item-row {
  padding: 8px 0;
  margin: 0 !important;
  border-bottom: 1px solid rgba(var(--v-theme-separator), 0.35);
}
.shopping-list-view .shopping-list-item-row:last-child {
  border-bottom: 0;
}
.shopping-list-view .shopping-list-item-row .v-container {
  margin-left: 0 !important;
}
.shopping-list-view .shopping-list-item-row .v-btn--size-small {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  margin-left: 0 !important;
}
.shopping-list-view .shopping-list-item-row .v-selection-control {
  --v-selection-control-size: 40px;
}
@media (max-width: 599px) {
  .shopping-details-heading h1 {
    flex: 1 1 100%;
  }
}
.shopping-list-progress {
  padding: 0 12px 8px;
}

.shopping-list-checked-section {
  overflow: hidden;
  border-radius: 14px;
}

.shopping-list-linked-recipes .v-sheet {
  border-radius: 14px;
  overflow: hidden;
}

.shopping-list-linked-recipes {
  overflow: visible;
}
.linked-recipes-info {
  border-radius: 10px;
}
.shopping-list-linked-recipes .v-sheet {
  box-shadow: none !important;
  border: 1px solid rgba(var(--v-theme-separator), 0.5);
  margin-bottom: 8px;
}
@media (max-width: 420px) {
  .shopping-list-linked-recipes .v-list-item {
    grid-template-areas: "prepend content" "append append";
    grid-template-columns: auto minmax(0, 1fr);
  }
  .shopping-list-linked-recipes .v-list-item__append {
    justify-content: flex-end;
    margin-top: 8px;
  }
}
/* Drag previews may be moved outside the list by Sortable. */
.shopping-list-item-row.recipe-drag-chosen,
.shopping-list-item-row.recipe-drag-active,
.shopping-list-item-row.recipe-drop-target {
  border-radius: 14px;
}
.shopping-list-checked-section.v-expansion-panel {
  border-radius: 14px !important;
  border: 1px solid rgba(var(--v-theme-separator), 0.5);
  background: rgb(var(--v-theme-surface));
}
.shopping-checked-header {
  min-height: 56px;
  padding: 8px 16px;
  font-size: 15px;
  font-weight: 500;
}
.shopping-list-checked-section .v-expansion-panel-text__wrapper {
  padding: 4px 12px 12px;
}
.shopping-list-checked-section .shopping-list-item-row {
  padding: 12px 0;
}
.shopping-list-checked-section .v-checkbox {
  color: rgb(var(--v-theme-text-secondary));
}
.shopping-list-item-row.recipe-drag-chosen,
.shopping-list-item-row.recipe-drag-active {
  background-color: rgb(var(--v-theme-surface-elevated)) !important;
  opacity: 1 !important;
}
.linked-recipe-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px 12px;
  font-size: 14px;
}
.linked-recipe-card > .v-list-item {
  padding: 12px;
}
.shopping-item-drag-preview {
  background: rgb(var(--v-theme-surface-elevated)) !important;
  opacity: 1 !important;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(var(--v-theme-on-surface), 0.16);
}
.shopping-item-drag-preview > * {
  opacity: 1 !important;
}
.shopping-checked-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0 12px;
  border-bottom: 1px solid rgba(var(--v-theme-separator), 0.4);
}
.shopping-checked-actions .v-btn {
  flex: 1 1 140px;
  min-height: 44px;
  height: auto;
  padding: 10px 12px;
  border-radius: 10px;
  text-transform: none;
  letter-spacing: normal;
  font-size: 13px;
}
.shopping-checked-actions .v-btn__content {
  white-space: normal;
  line-height: 1.4;
}
.shopping-list-checked-section .shopping-list-item-row + .shopping-list-item-row {
  border-top: 1px solid rgba(var(--v-theme-separator), 0.3);
}
</style>
