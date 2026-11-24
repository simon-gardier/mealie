<template>
  <BaseDialog
    v-model="dialog"
    :title="$t('shopping-list.add-item')"
    :icon="$globals.icons.createAlt"
    content-class="shopping-add-item-dialog"
    width="100%"
    max-width="560px"
    can-submit
    disable-submit-on-enter
    :submit-text="$t('general.add')"
    :submit-icon="$globals.icons.createAlt"
    :submit-disabled="!canAdd"
    @submit="emit('save')"
    @cancel="emit('cancel')"
  >
    <v-card-text class="shopping-add-item-form d-flex flex-column ga-3">
      <InputLabelType
        v-model="listItem.food"
        v-model:item-id="listItem.foodId!"
        :items="foods"
        :label="$t('shopping-list.food')"
        :icon="$globals.icons.foods"
        :menu-props="{ location: 'bottom' }"
        outlined
        autofocus
        create
        @create="createAssignFood"
      />
      <ShoppingListItemDetails
        v-model="listItem"
        :labels="labels"
        :units="units"
        menu-location="bottom"
        @save="submit"
      />
    </v-card-text>
  </BaseDialog>
</template>

<script setup lang="ts">
import { useShoppingListItemEditor } from "~/composables/shopping-list-page/use-shopping-list-item-editor";
import type { ShoppingListItemOut } from "~/lib/api/types/household";
import type { MultiPurposeLabelOut } from "~/lib/api/types/labels";
import type { IngredientFoodOut, IngredientUnitOut } from "~/lib/api/types/recipe";
import ShoppingListItemDetails from "./ShoppingListItemDetails.vue";

const dialog = defineModel<boolean>({ default: false });
const listItem = defineModel<ShoppingListItemOut>("item", { required: true });

defineProps<{
  labels: MultiPurposeLabelOut[];
  units: IngredientUnitOut[];
  foods: IngredientFoodOut[];
}>();

const emit = defineEmits<{
  (e: "save" | "cancel"): void;
}>();

const { createAssignFood } = useShoppingListItemEditor(listItem);

// an item needs at least a food or a note, the same rule the list applies when saving
const canAdd = computed(() => !!(listItem.value.foodId || listItem.value.note?.trim()));

/** Enter in the quantity or note field adds the item, like the dialog's Add button */
function submit() {
  if (!canAdd.value) return;
  emit("save");
  dialog.value = false;
}

watch(
  () => listItem.value.quantity,
  (newQty) => {
    if (!newQty) {
      listItem.value.quantity = 0;
    }
  },
);

watch(
  () => listItem.value.food,
  (newFood) => {
    listItem.value.label = newFood?.label || null;
    listItem.value.labelId = listItem.value.label?.id || null;
  },
);
</script>

<style scoped>
.shopping-add-item-form {
  padding-top: 20px;
}
</style>
