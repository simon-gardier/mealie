<template>
  <v-container fluid class="px-0">
    <RecipeExplorerPageSearch ref="searchComponent" @ready="onSearchReady" @toggle-view="toggleRecipeView" />
    <div class="random-recipe-action d-flex justify-center my-2">
      <v-btn icon color="error" variant="text" class="random-button" :disabled="recipes.length === 0"
        :aria-label="$t('general.random')" @click="navigateRandom">
        <v-icon>{{ $globals.icons.diceMultiple }}</v-icon>
      </v-btn>
    </div>
    <v-container class="mt-2 px-md-6 pb-16">
      <RecipeCardSection v-if="ready" ref="recipeSection" class="mt-n5" :recipes="recipes" :query="searchQuery"
        disable-toolbar disable-sort @item-selected="onItemSelected" @replace-recipes="replaceRecipes"
        @append-recipes="appendRecipes" />
    </v-container>
  </v-container>
</template>

<script setup lang="ts">
import RecipeExplorerPageSearch from "./RecipeExplorerPageParts/RecipeExplorerPageSearch.vue";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import RecipeCardSection from "~/components/Domain/Recipe/RecipeCardSection.vue";
import { useLazyRecipes } from "~/composables/recipes";

const auth = useMealieAuth();
const route = useRoute();
const { $globals } = useNuxtApp();

const { isOwnGroup } = useLoggedInState();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");

const { recipes, appendRecipes, replaceRecipes } = useLazyRecipes(isOwnGroup.value ? null : groupSlug.value);

const ready = ref(false);
const searchComponent = ref<InstanceType<typeof RecipeExplorerPageSearch>>();
const recipeSection = ref<InstanceType<typeof RecipeCardSection>>();

const searchQuery = computed(() => {
  return searchComponent.value?.passedQueryWithSeed || {};
});

function onSearchReady() {
  ready.value = true;
}

function onItemSelected(item: any, urlPrefix: string) {
  searchComponent.value?.filterItems(item, urlPrefix);
}

function navigateRandom() {
  recipeSection.value?.navigateRandom();
}

function toggleRecipeView() {
  recipeSection.value?.toggleMobileCards();
}
</script>

<style scoped>
.random-button {
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: 50%;
}
</style>
