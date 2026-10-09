<template>
  <div v-if="externalChips && selected?.length" class="d-flex flex-wrap mb-2">
    <v-chip
      v-for="(item, index) in selected"
      :key="item.id ?? organizerTitle(item)"
      class="organizer-chip mr-1 mb-1"
      color="primary"
      variant="tonal"
      label
      :text="organizerTitle(item)"
    >
      <template #prepend>
        <button
          type="button"
          class="organizer-chip-remove"
          :aria-label="$t('general.delete')"
          @click.stop.prevent="removeByIndex(index)"
        >
          <v-icon :icon="$globals.icons.close" size="18" />
        </button>
      </template>
    </v-chip>
  </div>
  <v-autocomplete
    v-model="selected"
    v-bind="inputAttrs"
    v-model:search="searchInput"
    :items="items"
    :menu-props="{ contentClass: 'recipe-editor-overlay' }"
    :custom-filter="normalizeFilter"
    :label="label"
    :chips="!externalChips"
    :closable-chips="!externalChips"
    :item-title="itemTitle"
    item-value="name"
    multiple
    :variant="variant"
    :prepend-inner-icon="icon"
    :append-icon="showAdd ? $globals.icons.create : undefined"
    return-object
    auto-select-first
    class="pa-0 ma-0"
    @update:model-value="resetSearchInput"
    @click:append="dialog = true"
    @keyup.enter="handleEnter"
  >
    <template v-if="!externalChips" #chip="{ internalItem: item, index }">
      <v-chip
        :key="item.raw.id ?? item.value"
        class="organizer-chip ma-1"
        color="primary"
        variant="tonal"
        label
        :text="item.title"
      >
        <template #prepend>
          <button
            type="button"
            class="organizer-chip-remove"
            :aria-label="$t('general.delete')"
            @click.stop.prevent="removeByIndex(index)"
          >
            <v-icon :icon="$globals.icons.close" size="18" />
          </button>
        </template>
      </v-chip>
    </template>
    <template v-if="externalChips" #selection />
    <template v-if="showAdd" #no-data>
      <div class="caption text-center pb-2">
        {{ $t("recipe.press-enter-to-create") }}
      </div>
    </template>
    <template v-if="showAdd && searchInput" #append-item>
      <div class="px-3 py-2">
        <v-btn variant="tonal" color="primary" class="organizer-create-button" @click="createItem()">
          <v-icon :icon="$globals.icons.create" size="18" class="mr-2" />
          {{ $t('recipe.parser.add-item', { name: searchInput }) }}
        </v-btn>
      </div>
    </template>
    <template v-if="showAdd" #append>
      <RecipeOrganizerDialog v-model="dialog" :item-type="selectorType" @created-item="appendCreated" />
    </template>
  </v-autocomplete>
</template>

<script setup lang="ts">
import type { IngredientFood, RecipeCategory, RecipeTag, RecipeTool } from "~/lib/api/types/recipe";
import { Organizer, type RecipeOrganizer } from "~/lib/api/types/non-generated";
import type { HouseholdSummary } from "~/lib/api/types/household";
import { useCategoryStore, useFoodStore, useLabelStore, useHouseholdStore, useTagStore, useToolStore } from "~/composables/store";
import { useUserStore } from "~/composables/store/use-user-store";
import { normalizeFilter } from "~/composables/use-utils";
import type { UserSummary } from "~/lib/api/types/user";

interface Props {
  selectorType: RecipeOrganizer;
  inputAttrs?: Record<string, any>;
  showAdd?: boolean;
  showLabel?: boolean;
  showIcon?: boolean;
  externalChips?: boolean;
  variant?: "filled" | "underlined" | "outlined" | "plain" | "solo" | "solo-inverted" | "solo-filled";
}

const props = withDefaults(defineProps<Props>(), {
  inputAttrs: () => ({}),
  showAdd: true,
  showLabel: true,
  showIcon: true,
  externalChips: false,
  variant: "filled",
});

const selected = defineModel<(
  | HouseholdSummary
  | RecipeTag
  | RecipeCategory
  | RecipeTool
  | IngredientFood
  | UserSummary
)[] | undefined>({ required: true });

onMounted(() => {
  if (selected.value === undefined) {
    selected.value = [];
  }
});

const i18n = useI18n();
function organizerTitle(item: NonNullable<typeof selected.value>[number]) {
  return "fullName" in item ? item.fullName : "name" in item ? item.name : "";
}
const { $globals } = useNuxtApp();

const label = computed(() => {
  if (!props.showLabel) {
    return "";
  }

  switch (props.selectorType) {
    case Organizer.Tag:
      return i18n.t("tag.tags");
    case Organizer.Category:
      return i18n.t("category.categories");
    case Organizer.Tool:
      return i18n.t("tool.tools");
    case Organizer.Food:
      return i18n.t("general.foods");
    case Organizer.Label:
      return i18n.t("data-pages.foods.food-label");
    case Organizer.Household:
      return i18n.t("household.households");
    case Organizer.User:
      return i18n.t("user.users");
    default:
      return i18n.t("general.organizer");
  }
});

const icon = computed(() => {
  if (!props.showIcon) {
    return "";
  }

  switch (props.selectorType) {
    case Organizer.Tag:
      return $globals.icons.tags;
    case Organizer.Category:
      return $globals.icons.categories;
    case Organizer.Tool:
      return $globals.icons.tools;
    case Organizer.Food:
      return $globals.icons.foods;
    case Organizer.Label:
      return $globals.icons.tags;
    case Organizer.Household:
      return $globals.icons.household;
    case Organizer.User:
      return $globals.icons.user;
    default:
      return $globals.icons.tags;
  }
});

const itemTitle = computed(() =>
  props.selectorType === Organizer.User
    ? (i: any) => i?.fullName ?? i?.name ?? ""
    : "name",
);

// ===========================================================================
// Store & Items Setup

const storeMap = {
  [Organizer.Category]: useCategoryStore(),
  [Organizer.Tag]: useTagStore(),
  [Organizer.Tool]: useToolStore(),
  [Organizer.Food]: useFoodStore(),
  [Organizer.Label]: useLabelStore(),
  [Organizer.Household]: useHouseholdStore(),
  [Organizer.User]: useUserStore(),
};

const activeStore = computed(() => {
  const { store } = storeMap[props.selectorType];
  return store.value;
});

const items = computed<any[]>(() => {
  const list = (activeStore.value as unknown as any[]) ?? [];
  return list;
});

function removeByIndex(index: number) {
  if (selected.value === undefined) {
    return;
  }

  const newSelected = selected.value.filter((_, i) => i !== index);
  selected.value = [...newSelected];
}

function appendCreated(item: any) {
  if (selected.value === undefined) {
    return;
  }

  selected.value = [...selected.value, item];
}

function handleEnter() {
  if (!searchInput.value) {
    return;
  }
  const exactMatch = items.value.some(
    (item: any) => (item.name ?? "").toLowerCase() === searchInput.value.toLowerCase(),
  );
  if (!exactMatch) {
    createItem();
  }
}

async function createItem() {
  if (!searchInput.value) {
    return;
  }

  const actions = storeMap[props.selectorType].actions;
  // @ts-expect-error different organizer types have different required fields
  const newItem = await actions.createOne({ name: searchInput.value });
  if (newItem) {
    appendCreated(newItem);
  }
  searchInput.value = "";
}

const dialog = ref(false);

const searchInput = ref("");

function resetSearchInput() {
  searchInput.value = "";
}
</script>

<style scoped>
.v-autocomplete {
  /* This aligns the input with other standard input fields */
  margin-top: 6px;
}
.organizer-chip {
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: normal;
  max-width: 100%;
  height: auto;
  min-height: 36px;
  padding-block: 4px;
}

.organizer-create-button {
  border-radius: 10px;
  min-height: 44px;
  height: auto;
  max-width: 100%;
  padding-block: 10px;
  text-transform: none;
  letter-spacing: normal;
  font-size: 14px;
}
.organizer-create-button :deep(.v-btn__content) {
  white-space: normal;
}
.organizer-chip-remove {
  appearance: none;
  background: rgb(var(--v-theme-chip-remove-background));
  border-radius: 50%;
  width: 22px;
  height: 22px;
  justify-content: center;
  border: 0;
  padding: 2px;
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  line-height: 1;
  box-shadow: none;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  margin-inline-start: 0;
  margin-inline-end: 8px;
}

.organizer-chip :deep(.v-chip__content) {
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
}
</style>
