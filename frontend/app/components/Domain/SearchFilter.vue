<template>
  <div>
    <v-menu v-model="state.menu" offset-y bottom nudge-bottom="3" :close-on-content-click="false"
      content-class="search-filter-menu">
      <template #activator="{ props: menuProps }">
        <v-badge :model-value="selectedCount > 0" size="small" color="primary" :content="selectedCount">
          <v-btn size="small" color="accent" dark v-bind="menuProps">
            <slot />
          </v-btn>
        </v-badge>
      </template>
      <v-card class="search-filter-card" width="400">
        <v-card-text>
          <v-text-field v-model="searchInput" v-memo="[searchInput]" class="mb-2" hide-details density="comfortable"
            variant="outlined" :label="`${$t('search.search')}...`" :prepend-inner-icon="$globals.icons.search"
            clearable />
          <div />
          <div class="d-flex flex-column align-center py-4 px-1">
            <v-btn-toggle v-if="requireAll != undefined" v-model="combinator" mandatory density="compact"
              color="primary" class="filter-combinator" :class="{ 'filter-combinator--any': combinator === 'hasAny' }"
              rounded="lg">
              <v-btn value="hasAll">
                {{ $t('search.has-all') }}
              </v-btn>
              <v-btn value="hasAny">
                {{ $t('search.has-any') }}
              </v-btn>
            </v-btn-toggle>
          </div>
          <v-card v-if="filtered.length > 0" flat variant="text">
            <!-- radio filters -->
            <v-radio-group v-if="radio" v-model="selectedRadio" class="ma-0 pa-0">
              <v-virtual-scroll :items="filtered" height="300">
                <template #default="{ item }">
                  <v-list-item :key="`radio-${item.id}`" v-memo="[item.id, item.name, selectedRadio?.id]" :value="item"
                    :title="item.name">
                    <template #prepend>
                      <v-list-item-action start>
                        <v-radio v-if="radio" :value="item" color="primary" @click="handleRadioClick(item)" />
                      </v-list-item-action>
                    </template>
                  </v-list-item>
                  <v-divider />
                </template>
              </v-virtual-scroll>
            </v-radio-group>
            <!-- checkbox filters -->
            <v-row v-else class="mt-1">
              <v-virtual-scroll :items="filtered" height="300">
                <template #default="{ item }">
                  <v-list-item :key="`checkbox-${item.id}`" v-memo="[item.id, item.name, selectedIds.has(item.id)]"
                    :value="item" :title="item.name">
                    <template #prepend>
                      <v-list-item-action start>
                        <v-checkbox-btn v-model="selected" :value="item" color="primary" />
                      </v-list-item-action>
                    </template>
                  </v-list-item>
                  <v-divider />
                </template>
              </v-virtual-scroll>
            </v-row>
          </v-card>
          <div v-else>
            <BaseNoResultsAlert :text="$t('search.no-results')" class="mb-0" />
          </div>
        </v-card-text>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import type { ISearchableItem } from "~/composables/use-search";
import { useSearch } from "~/composables/use-search";

const props = defineProps({
  items: {
    type: Array as () => ISearchableItem[],
    required: true,
  },
  requireAll: {
    type: Boolean,
    default: undefined,
  },
  radio: {
    type: Boolean,
    default: false,
  },
});

const modelValue = defineModel<ISearchableItem[]>();

const { $globals } = useNuxtApp();

const emit = defineEmits<{
  (e: "update:requireAll", value: boolean | undefined): void;
}>();

const state = reactive({
  menu: false,
});

// Use the search composable
const { search: searchInput, filtered } = useSearch(computed(() => props.items));

const combinator = computed({
  get: () => (props.requireAll ? "hasAll" : "hasAny"),
  set: (value: string) => {
    emit("update:requireAll", value === "hasAll");
  },
});

const selected = computed<ISearchableItem[]>({
  get: () => modelValue.value ?? [],
  set: (value: ISearchableItem[]) => {
    modelValue.value = value;
  },
});

const selectedRadio = computed<null | ISearchableItem>({
  get: () => (selected.value.length > 0 ? selected.value[0] : null),
  set: (value: ISearchableItem | null) => {
    const next = value ? [value] : [];
    selected.value = next;
  },
});

const selectedCount = computed(() => selected.value.length);
const selectedIds = computed(() => new Set(selected.value.map(item => item.id)));

const handleRadioClick = (item: ISearchableItem) => {
  if (selectedRadio.value === item) {
    selectedRadio.value = null;
  }
};
</script>

<style scoped>
.filter-combinator {
  border: 1px solid rgb(var(--v-theme-primary));
  border-radius: 9px 12px 10px 11px !important;
  isolation: isolate;
  overflow: hidden;
  position: relative;
}

.filter-combinator::before {
  background-color: rgb(var(--v-theme-primary));
  content: "";
  inset: 0 auto 0 0;
  position: absolute;
  transform: translateX(0);
  transition: transform 220ms ease;
  width: 50%;
  z-index: 0;
}

.filter-combinator--any::before {
  transform: translateX(100%);
}

.filter-combinator :deep(.v-btn) {
  min-width: 9rem;
  position: relative;
  transition: color 160ms ease;
  z-index: 1;
}

.filter-combinator :deep(.v-btn:first-child) {
  border-bottom-right-radius: 0 !important;
  border-top-right-radius: 0 !important;
}

.filter-combinator :deep(.v-btn:last-child) {
  border-bottom-left-radius: 0 !important;
  border-top-left-radius: 0 !important;
}

.filter-combinator :deep(.v-btn--active) {
  background-color: transparent;
  color: rgb(var(--v-theme-on-primary));
}

.filter-combinator :deep(.v-btn--active .v-btn__overlay) {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {

  .filter-combinator::before,
  .filter-combinator :deep(.v-btn) {
    transition: none;
  }
}
</style>

<style>
@media (max-width: 599px) {
  .search-filter-menu {
    left: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    max-width: 100vw !important;
    min-width: 100vw !important;
    right: 0 !important;
    width: 100vw !important;
  }

  .search-filter-menu .search-filter-card {
    border-radius: 0;
    width: 100% !important;
  }
}
</style>
