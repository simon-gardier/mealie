<template>
  <div>
    <div class="recipe-title-image">
      <v-img src="/recipes.png" alt="Recipes" max-width="360" />
    </div>
    <RecipeExplorerPage />
  </div>
</template>

<script setup lang="ts">
import RecipeExplorerPage from "~/components/Domain/Recipe/RecipeExplorerPage/RecipeExplorerPage.vue";
</script>

<style scoped>
.recipe-title-image {
  display: flex;
  justify-content: center;
  padding: 1rem 1rem 0;
}
</style>
