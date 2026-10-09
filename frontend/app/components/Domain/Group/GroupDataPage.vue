<template>
  <!-- Create Dialog -->
  <BaseDialog
    v-model="createDialog"
    :content-class="dialogClass"
    :title="createTitle || $t('general.create')"
    :icon="icon"
    color="primary"
    max-width="600px"
    width="100%"
    :submit-disabled="!createFormValid"
    can-confirm
    @confirm="emit('create-one', createForm.data)"
  >
    <div class="mx-2 mt-2">
      <slot name="create-dialog-top" />
      <AutoForm
        v-model="createForm.data"
        v-model:is-valid="createFormValid"
        :items="createForm.items"
        :variant="formVariant"
        class="py-2"
      />
      <slot name="create-dialog-bottom" />
    </div>
  </BaseDialog>

  <!-- Edit Dialog -->
  <BaseDialog
    v-model="editDialog"
    :content-class="['group-data-edit-dialog', dialogClass].filter(Boolean).join(' ')"
    cancel-in-toolbar
    :title="editTitle || $t('general.edit')"
    :icon="icon"
    color="primary"
    max-width="600px"
    width="100%"
    :submit-disabled="!editFormValid"
    can-confirm
    @confirm="emit('edit-one', editForm.data)"
  >
    <div class="mx-2 mt-2">
      <slot name="edit-dialog-top" />
      <AutoForm
        v-model="editForm.data"
        v-model:is-valid="editFormValid"
        :items="editForm.items"
        :variant="formVariant"
        class="py-2"
      />
      <slot name="edit-dialog-bottom" />
    </div>
    <template #custom-card-action>
      <slot name="edit-dialog-custom-action" />
    </template>
  </BaseDialog>

  <!-- Delete Dialog -->
  <BaseDialog
    v-model="deleteDialog"
    bottom-sheet
    :title="$t('general.confirm')"
    :icon="$globals.icons.alertCircle"
    color="error"
    can-confirm
    @confirm="$emit('deleteOne', deleteTarget.id)"
  >
    <v-card-text>
      {{ $t("general.confirm-delete-generic") }}
      <p v-if="deleteTarget" class="mt-4 mb-0 font-weight-bold">
        {{ deleteTarget.name || deleteTarget.title || deleteTarget.id }}
      </p>
      <slot name="delete-dialog-bottom" />
    </v-card-text>
  </BaseDialog>

  <!-- Bulk Delete Dialog -->
  <BaseDialog
    v-model="bulkDeleteDialog"
    bottom-sheet
    width="650px"
    :title="$t('general.confirm')"
    :icon="$globals.icons.alertCircle"
    color="error"
    can-confirm
    @confirm="$emit('bulk-action', 'delete-selected', bulkDeleteTarget)"
  >
    <v-card-text>
      <p class="h4">
        {{ $t('general.confirm-delete-generic-items') }}
      </p>
      <v-card variant="outlined" rounded="lg">
        <v-virtual-scroll height="400" item-height="25" :items="bulkDeleteTarget">
          <template #default="{ item }">
            <v-list-item class="pb-2">
              <v-list-item-title>{{ item.name || item.title || item.id }}</v-list-item-title>
            </v-list-item>
          </template>
        </v-virtual-scroll>
      </v-card>
      <slot name="delete-dialog-bottom" />
    </v-card-text>
  </BaseDialog>

  <BaseCardSectionTitle :icon="icon" :title-image="titleImage" section :title="title" />

  <CrudTable
    :headers="tableHeaders"
    :table-config="tableConfig"
    :data="data || []"
    :bulk-actions="bulkActions"
    :initial-sort="initialSort"
    @edit-one="editEventHandler"
    @delete-one="deleteEventHandler"
    @bulk-action="handleBulkAction"
  >
    <template v-for="slotName in itemSlotNames" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps" />
    </template>
    <template #button-row>
      <BaseButton create @click="createDialog = true">
        {{ $t("general.create") }}
      </BaseButton>
      <slot name="table-button-row" />
    </template>
    <template #button-bottom>
      <slot name="table-button-bottom" />
    </template>
  </CrudTable>
</template>

<script setup lang="ts">
import type { TableHeaders, TableConfig, BulkAction } from "~/components/global/CrudTable.vue";
import type { AutoFormItems } from "~/types/auto-forms";

const slots = useSlots();

const emit = defineEmits<{
  (e: "deleteOne", id: string): void;
  (e: "deleteMany", ids: string[]): void;
  (e: "create-one" | "edit-one", data: any): void;
  (e: "bulk-action", event: string, items: any[]): void;
}>();

const tableHeaders = defineModel<TableHeaders[]>("tableHeaders", { required: true });
const createForm = defineModel<{ items: AutoFormItems; data: Record<string, any> }>("createForm", { required: true });
const createDialog = defineModel("createDialog", { type: Boolean, default: false });

const editForm = defineModel<{ items: AutoFormItems; data: Record<string, any> }>("editForm", { required: true });
const editDialog = defineModel("editDialog", { type: Boolean, default: false });

const props = defineProps({
  dialogClass: { type: String, default: "" },
  formVariant: { type: String as PropType<"filled" | "outlined">, default: "filled" },
  icon: {
    type: String,
    required: true,
  },
  titleImage: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    required: true,
  },
  createTitle: {
    type: String,
  },
  editTitle: {
    type: String,
  },
  tableConfig: {
    type: Object as PropType<TableConfig>,
    default: () => ({
      hideColumns: false,
      canExport: true,
    }),
  },
  data: {
    type: Array as PropType<Array<any>>,
    required: true,
  },
  bulkActions: {
    type: Array as PropType<BulkAction[]>,
    required: true,
  },
  initialSort: {
    type: String,
    default: "name",
  },
  onDeleteDialogOpen: {
    type: Function as PropType<(items: any[]) => Promise<void>>,
    default: null,
  },
});

// ============================================================
// Bulk Action Handler
function handleBulkAction(event: string, items: any[]) {
  if (event === "delete-selected") {
    bulkDeleteEventHandler(items);
    return;
  }
  emit("bulk-action", event, items);
}

// ============================================================
// Create & Edit
const createFormValid = ref(false);
const editFormValid = ref(false);
const itemSlotNames = computed(() => Object.keys(slots).filter(slotName => slotName.startsWith("item.")));
const editEventHandler = (item: any) => {
  editForm.value.data = { ...item };
  editDialog.value = true;
};

// ============================================================
// Delete Logic
const deleteTarget = ref<any>(null);
const deleteDialog = ref(false);

async function deleteEventHandler(item: any) {
  deleteTarget.value = item;
  if (props.onDeleteDialogOpen) {
    await props.onDeleteDialogOpen([item]);
  }
  deleteDialog.value = true;
}

// ============================================================
// Bulk Delete Logic
const bulkDeleteTarget = ref<Array<any>>([]);
const bulkDeleteDialog = ref(false);

async function bulkDeleteEventHandler(items: Array<any>) {
  bulkDeleteTarget.value = items;
  if (props.onDeleteDialogOpen) {
    await props.onDeleteDialogOpen(items);
  }
  bulkDeleteDialog.value = true;
  console.log("Bulk Delete Event Handler", items);
}
</script>

<style>
.group-data-edit-dialog .base-dialog-card > .v-spacer {
  display: none;
}
.group-data-edit-dialog .base-dialog-card > div:not(.v-card-actions):not(.v-toolbar) > .mx-2 {
  margin: 0 !important;
  padding: 24px;
}
.group-data-edit-dialog .v-field {
  border-radius: 10px;
}
.group-data-edit-dialog .v-field input,
.group-data-edit-dialog .v-label {
  font-family: var(--bistro-body);
}
.group-data-edit-dialog .base-dialog-card > .v-card-actions {
  flex: 0 0 auto;
  padding: 8px 16px max(8px, env(safe-area-inset-bottom)) !important;
}
@media (max-width: 599px) {
  .group-data-edit-dialog .base-dialog-card > div:not(.v-card-actions):not(.v-toolbar) > .mx-2 {
    padding: 16px;
  }
}
</style>
