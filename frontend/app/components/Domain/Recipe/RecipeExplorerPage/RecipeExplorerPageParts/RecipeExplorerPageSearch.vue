<template>
  <div class="search-container pb-8">
    <form class="search-box bistro-discovery-panel pa-2" @submit.prevent="search">
      <div class="d-flex justify-center align-center ga-2 mb-2">
        <v-text-field ref="input" v-model="state.search" variant="outlined" hide-details clearable color="primary"
          class="flex-grow-1" :placeholder="$t('search.search-placeholder')" :prepend-inner-icon="$globals.icons.search"
          @keyup.enter="hideKeyboard" />
        <v-btn icon color="error" class="random-button" :disabled="recipeCount === 0" :aria-label="$t('general.random')"
          @click="emit('random')">
          <v-icon>{{ $globals.icons.diceMultiple }}</v-icon>
        </v-btn>
        <!-- <v-switch v-model="state.auto" :label="$t('search.auto-search')" inset color="primary" hide-details
          class="ml-3 mr-0 auto-search-toggle" /> -->
      </div>
      <div class="search-row">
        <RecipeExplorerPageSearchFilters />
        <div class="search-actions">
          <!-- Sort Options -->
          <v-menu offset-y nudge-bottom="3">
            <template #activator="{ props }">
              <v-btn size="small" color="accent" v-bind="props">
                <v-icon :start="!$vuetify.display.xs">
                  {{ state.orderDirection === "asc" ? $globals.icons.sortDescending : $globals.icons.sortAscending }}
                </v-icon>
                {{ $vuetify.display.xs ? null : sortText }}
              </v-btn>
            </template>
            <v-card>
              <v-list>
                <v-list-item slim density="comfortable"
                  :prepend-icon="state.orderDirection === 'asc' ? $globals.icons.sortAscending : $globals.icons.sortDescending"
                  :title="state.orderDirection === 'asc' ? $t('general.sort-descending') : $t('general.sort-ascending')"
                  @click="toggleOrderDirection" />
                <v-divider />
                <v-list-item v-for="v in sortable" :key="v.name" :active="state.orderBy === v.value" slim
                  density="comfortable"
                  @click.stop="v.value === 'random' ? setRandomOrderByWrapper() : setOrderBy(v.value)">
                  <template #prepend>
                    <v-icon>{{ v.icon }}</v-icon>
                  </template>

                  <template #title>
                    <span>{{ v.name }}</span>
                    <v-icon v-if="v.value === 'random' && showRandomLoading" size="small" class="ml-3">
                      {{ $globals.icons.refreshCircle }}
                    </v-icon>
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>
          <v-btn class="search-view-toggle" size="small" color="accent" @click="emit('toggleView')" variant="flat">
            <v-icon>{{ $globals.icons.gridView }}</v-icon>
          </v-btn>
          <v-btn size="small" color="accent" @click="reset" variant="flat">
            <v-icon>{{ $globals.icons.refresh }}</v-icon>
          </v-btn>
        </div>
      </div>
      <!-- <div v-if="!state.auto" class="search-button-container">
        <v-btn size="x-large" color="primary" type="submit" block>
          <v-icon start>
            {{ $globals.icons.search }}
          </v-icon>
          {{ $t("search.search") }}
        </v-btn>
      </div> -->
    </form>
  </div>
</template>

<script setup lang="ts">
import RecipeExplorerPageSearchFilters from "./RecipeExplorerPageSearchFilters.vue";
import { useRecipeExplorerSearch, clearRecipeExplorerSearchState } from "~/composables/use-recipe-explorer-search";

const emit = defineEmits<{
  ready: [];
  random: [];
  toggleView: [];
}>();

interface Props {
  recipeCount?: number;
}

withDefaults(defineProps<Props>(), {
  recipeCount: 0,
});

const auth = useMealieAuth();
const route = useRoute();
const { $globals } = useNuxtApp();
const i18n = useI18n();
const showRandomLoading = ref(false);

const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");

const {
  state,
  passedQueryWithSeed,
  search,
  reset,
  toggleOrderDirection,
  setOrderBy,
  setRandomOrderBy,
  filterItems,
  initialize,
} = useRecipeExplorerSearch(groupSlug);

defineExpose({
  passedQueryWithSeed,
  filterItems,
});

onMounted(async () => {
  await initialize();
  emit("ready");
});

onUnmounted(() => {
  // Clear the cache when component unmounts to ensure fresh state on remount
  clearRecipeExplorerSearchState(groupSlug.value);
});

const sortText = computed(() => {
  const sort = sortable.value.find(s => s.value === state.value.orderBy);
  if (!sort) return "";
  return `${sort.name}`;
});

const sortable = computed(() => [
  {
    icon: $globals.icons.orderAlphabeticalAscending,
    name: i18n.t("general.sort-alphabetically"),
    value: "name",
  },
  {
    icon: $globals.icons.newBox,
    name: i18n.t("general.created"),
    value: "created_at",
  },
  {
    icon: $globals.icons.chefHat,
    name: i18n.t("general.last-made"),
    value: "last_made",
  },
  {
    icon: $globals.icons.star,
    name: i18n.t("general.rating"),
    value: "rating",
  },
  {
    icon: $globals.icons.update,
    name: i18n.t("general.updated"),
    value: "updated_at",
  },
  {
    icon: $globals.icons.diceMultiple,
    name: i18n.t("general.random"),
    value: "random",
  },
]);

// Methods
const input: Ref<any> = ref(null);

function hideKeyboard() {
  input.value?.blur();
}

// function to show refresh icon
async function setRandomOrderByWrapper() {
  if (!showRandomLoading.value) {
    showRandomLoading.value = true;
  }
  await setRandomOrderBy();
}
</script>

<style scoped>
.random-button {
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: 8px;
}
</style>

<style scoped>
.search-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1rem;
}

.search-actions {
  display: flex;
  gap: 0.65rem;
  margin-left: auto;
}

@media (max-width: 599px) {
  .search-actions {
    flex-basis: 100%;
    margin-left: 0;
  }

  .search-view-toggle {
    display: none;
  }
}

.search-container {
  display: flex;
  justify-content: center;
}

.search-box {
  width: 950px;
}

.search-button-container {
  margin: 3rem auto 0 auto;
  max-width: 500px;
}
</style>
