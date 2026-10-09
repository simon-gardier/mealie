<template>
  <v-container>
    <RecipeCardSection
      v-if="recipes && isOwnGroup"
      :title="$t('user.user-favorites')"
      title-image="/loved_recipes.png"
      :recipes="recipes"
      :query="query"
      @sort-recipes="assignSorted"
      @replace-recipes="replaceRecipes"
      @append-recipes="appendRecipes"
      @delete="removeRecipe"
    />
  </v-container>
</template>

<script setup lang="ts">
import { useUserSelfRatings } from "~/composables/use-users";
import RecipeCardSection from "~/components/Domain/Recipe/RecipeCardSection.vue";
import { useLazyRecipes } from "~/composables/recipes";
import { useLoggedInState } from "~/composables/use-logged-in-state";

const route = useRoute();
const i18n = useI18n();
const { isOwnGroup } = useLoggedInState();

useSeoMeta({
  title: i18n.t("general.favorites"),
});

const userId = route.params.id;
const query = { queryFilter: `favoritedBy.id = "${userId}"` };
const { recipes, appendRecipes, assignSorted, removeRecipe, replaceRecipes } = useLazyRecipes();
const auth = useMealieAuth();
const { userRatings } = useUserSelfRatings();
watch(() => userRatings.value.filter(rating => rating.isFavorite).map(rating => rating.recipeId), (ids, previous) => {
  if (auth.user.value?.id !== userId) return;
  const removed = new Set(previous.filter(id => !ids.includes(id)));
  for (const recipe of [...recipes.value]) {
    if (recipe.id && removed.has(recipe.id)) removeRecipe(recipe.slug);
  }
});
</script>

<style scoped></style>
