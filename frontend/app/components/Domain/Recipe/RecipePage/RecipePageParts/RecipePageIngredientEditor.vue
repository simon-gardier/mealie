<template>
  <div>
    <div class="mb-4">
      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
        <h2 class="mb-0 text-h5 font-weight-medium opacity-80">
          {{ $t("recipe.ingredients") }}
        </h2>
        <div v-if="!hasFoodOrUnit" class="d-flex align-center ga-1">
          <v-btn color="info" @click="toggleIsParsing(true)">
            <v-icon start>
              {{ $globals.icons.robot }}
            </v-icon>
            {{ $t('recipe.parse') }}
          </v-btn>
          <v-menu location="bottom" content-class="ingredient-info-tooltip">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="text" color="info"
                :aria-label="$t('recipe.ingredients-not-parsed-description', { parse: $t('recipe.parse') })">
                <v-icon>{{ $globals.icons.information }}</v-icon>
              </v-btn>
            </template>
            <v-sheet class="pa-3 text-body-2" color="surface" elevation="4" rounded>
              {{ $t('recipe.ingredients-not-parsed-description', { parse: $t('recipe.parse') }) }}
            </v-sheet>
          </v-menu>
        </div>
      </div>
    </div>
    <VueDraggable v-if="recipe.recipeIngredient.length > 0" v-model="recipe.recipeIngredient" handle=".handle"
      :delay="250" :delay-on-touch-only="true" v-bind="{
        animation: 200,
        group: 'recipe-ingredients',
        disabled: false,
        ghostClass: 'ghost',
      }" @start="drag = true" @end="drag = false">
      <RecipeIngredientEditor v-for="(ingredient, index) in recipe.recipeIngredient" :key="ingredient.referenceId"
        v-model="recipe.recipeIngredient[index]" :is-recipe="ingredientIsRecipe(ingredient)" enable-drag-handle
        enable-context-menu @delete="recipe.recipeIngredient.splice(index, 1)"
        @insert-above="insertNewIngredient(index)" @insert-below="insertNewIngredient(index + 1)" />
    </VueDraggable>
    <v-skeleton-loader v-else boilerplate elevation="2" type="list-item" />
    <div class="d-flex flex-wrap justify-center mt-5 mb-5">
      <RecipeDialogBulkAdd ref="domBulkAddDialog" class="mx-1 mb-1" style="display: none" @bulk-data="addIngredient" />
      <div class="d-inline-flex">
        <!-- Main button: Add Food -->
        <v-btn color="success" class="split-main ml-2" @click="addIngredient">
          <v-icon start>
            {{ $globals.icons.createAlt }}
          </v-icon>
          {{ $t('general.add') || 'Add Food' }}
        </v-btn>
        <!-- Dropdown button -->
        <v-menu>
          <template #activator="{ props }">
            <v-btn color="success" class="split-dropdown" v-bind="props">
              <v-icon>{{ $globals.icons.chevronDown }}</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item slim density="comfortable" :prepend-icon="$globals.icons.foods"
              :title="$t('new-recipe.add-food')" @click="addIngredient" />
            <v-list-item slim density="comfortable" :prepend-icon="$globals.icons.silverwareForkKnife"
              :title="$t('new-recipe.add-recipe')" @click="addRecipe" />
            <v-list-item slim density="comfortable" :prepend-icon="$globals.icons.create"
              :title="$t('new-recipe.bulk-add')" @click="showBulkAdd" />
          </v-list>
        </v-menu>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import type { Recipe, RecipeIngredient } from "~/lib/api/types/recipe";
import RecipeIngredientEditor from "~/components/Domain/Recipe/RecipeIngredientEditor.vue";
import RecipeDialogBulkAdd from "~/components/Domain/Recipe/RecipeDialogBulkAdd.vue";
import { usePageState } from "~/composables/recipe-page/shared-state";
import { uuid4 } from "~/composables/use-utils";

const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });
const ingredientsWithRecipe = new Map<string, boolean>();

const drag = ref(false);
const domBulkAddDialog = ref<InstanceType<typeof RecipeDialogBulkAdd> | null>(null);
const { toggleIsParsing } = usePageState(recipe.value.slug);

const hasFoodOrUnit = computed(() => {
  if (!recipe.value) {
    return false;
  }
  if (recipe.value.recipeIngredient) {
    for (const ingredient of recipe.value.recipeIngredient) {
      if (ingredient.food || ingredient.unit) {
        return true;
      }
    }
  }
  return false;
});

function showBulkAdd() {
  domBulkAddDialog.value?.open();
}

function ingredientIsRecipe(ingredient: RecipeIngredient): boolean {
  if (ingredient.referencedRecipe) {
    return true;
  }

  if (ingredient.referenceId) {
    return !!ingredientsWithRecipe.get(ingredient.referenceId);
  }

  return false;
}

function addIngredient(ingredients: Array<string> | null = null) {
  if (ingredients?.length) {
    const newIngredients = ingredients.map((x) => {
      return {
        referenceId: uuid4(),
        title: "",
        note: x,
        unit: undefined,
        food: undefined,
        quantity: 0,
      };
    });

    if (newIngredients) {
      // @ts-expect-error - prop can be null-type by NoUndefinedField type forces it to be set
      recipe.value.recipeIngredient.push(...newIngredients);
    }
  }
  else {
    recipe.value.recipeIngredient.push({
      referenceId: uuid4(),
      title: "",
      note: "",
      // @ts-expect-error - prop can be null-type by NoUndefinedField type forces it to be set
      unit: undefined,
      // @ts-expect-error - prop can be null-type by NoUndefinedField type forces it to be set
      food: undefined,
      quantity: 0,
    });
  }
}

function addRecipe(recipes: Array<string> | null = null) {
  const refId = uuid4();
  ingredientsWithRecipe.set(refId, true);

  if (recipes?.length) {
    const newRecipes = recipes.map((x) => {
      return {
        referenceId: refId,
        title: "",
        note: x,
        unit: undefined,
        referencedRecipe: undefined,
        quantity: 1,
      };
    });

    if (newRecipes) {
      // @ts-expect-error - prop can be null-type by NoUndefinedField type forces it to be set
      recipe.value.recipeIngredient.push(...newRecipes);
    }
  }
  else {
    recipe.value.recipeIngredient.push({
      referenceId: refId,
      title: "",
      note: "",
      // @ts-expect-error - prop can be null-type by NoUndefinedField type forces it to be set
      unit: undefined,
      // @ts-expect-error - prop can be null-type by NoUndefinedField type forces it to be set
      referencedRecipe: undefined,
      quantity: 1,
    });
  }
}

function insertNewIngredient(dest: number) {
  recipe.value.recipeIngredient.splice(dest, 0, {
    referenceId: uuid4(),
    title: "",
    note: "",
    // @ts-expect-error - prop can be null-type by NoUndefinedField type forces it to be set
    unit: undefined,
    // @ts-expect-error - prop can be null-type by NoUndefinedField type forces it to be set
    food: undefined,
    quantity: 0,
  });
}
</script>

<style scoped>
.split-main {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

.split-dropdown {
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  min-width: 30px;
  padding-left: 0;
  padding-right: 0;
}

:global(.ingredient-info-tooltip) {
  max-width: 280px !important;
  white-space: normal;
}
</style>
