<template>
  <v-navigation-drawer ref="target" permanent rounded="t-xl" location="bottom" class="pa-4 pt-0 mb-0"
    :width="drawerHeight" rail-width="92" :rail="rail" elevation="4">
    <!-- top padding lives inside the scrollable content so the floating label isn't clipped -->
    <div ref="contentRef" class="d-flex flex-column ga-3 pt-3">
      <div class="position-relative">
        <InputLabelType ref="foodInputRef" v-model="listItem.food" v-model:item-id="listItem.foodId!" :items="foods"
          :label="rail ? $t('shopping-list.add-item') : $t('shopping-list.food')" :icon="$globals.icons.foods"
          outlined :style="rail ? 'margin-inline: 3px;' : undefined" :search="rail"
          :menu-props="{ location: menuDirection }" create @create="createAssignFood" />
        <!-- Intercept clicks when collapsed so the drawer expands before the autocomplete opens -->
        <div v-if="rail" class="position-absolute" style="inset: 0; cursor: text;" @click="expandAndFocus" />
      </div>

      <ShoppingListItemDetails v-if="!rail" v-model="listItem" :labels="labels" :units="units" @save="$emit('save')" />

      <div v-if="!rail" class="d-flex justify-space-between">
        <BaseButton cancel hide-icon @click="rail = true; $emit('cancel')" />
        <BaseButton save @click="$emit('save')" />
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useShoppingListItemEditor } from "~/composables/shopping-list-page/use-shopping-list-item-editor";
import type { ShoppingListItemOut } from "~/lib/api/types/household";
import type { MultiPurposeLabelOut } from "~/lib/api/types/labels";
import type { IngredientFood, IngredientUnit } from "~/lib/api/types/recipe";
import ShoppingListItemDetails from "./ShoppingListItemDetails.vue";
import { onClickOutside, useElementSize } from "@vueuse/core";

// modelValue as reactive v-model
const listItem = defineModel<ShoppingListItemOut>({ required: true });

defineProps({
  labels: {
    type: Array as () => MultiPurposeLabelOut[],
    required: true,
  },
  units: {
    type: Array as () => IngredientUnit[],
    required: true,
  },
  foods: {
    type: Array as () => IngredientFood[],
    required: true,
  },
});

defineEmits<{
  (e: "save" | "cancel" | "delete"): void;
}>();

const { createAssignFood } = useShoppingListItemEditor(listItem);

const { smAndDown, height: viewportHeight } = useDisplay();
const menuDirection = computed(() => smAndDown.value ? "top" : "bottom");

const foodInputRef = ref<{ focus: () => void } | null>(null);
const rail = ref(true);

// For a bottom drawer Vuetify uses `width` as the drawer's height, so it has to
// track the form's actual height instead of being a fixed/percentage value
const contentRef = ref<HTMLElement | null>(null);
const { height: contentHeight } = useElementSize(contentRef, undefined, { box: "border-box" });
const DRAWER_PADDING = 16;
const drawerHeight = computed(() => {
  const desired = Math.ceil(contentHeight.value) + DRAWER_PADDING;
  return Math.min(desired, Math.round(viewportHeight.value * 0.9));
});

async function expandAndFocus() {
  rail.value = false;
  await nextTick();
  setTimeout(() => {
    foodInputRef.value?.focus();
  }, 200);
}

const target = ref();
// Autocomplete menus are teleported outside the drawer, so selecting an item
// would otherwise register as an outside click and collapse the form
onClickOutside(target, () => rail.value = true, { ignore: [".v-overlay-container"] });

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
