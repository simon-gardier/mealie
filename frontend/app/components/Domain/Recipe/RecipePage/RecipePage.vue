<template>
  <div :class="{ 'cook-mode-surface': isCookMode, 'recipe-editor': isEditForm, 'recipe-view': !isEditMode && !isCookMode }">
    <RecipePageCreationCelebration v-if="showCreationCelebration" @complete="showCreationCelebration = false" />
    <BaseDialog
      v-model="discardDialog"
      bottom-sheet
      :title="$t('general.discard-changes')"
      color="warning"
      :icon="$globals.icons.alertCircle"
      can-confirm
      @confirm="confirmDiscard"
      @cancel="cancelDiscard"
    >
      <v-card-text>
        {{ $t("general.discard-changes-description") }}
      </v-card-text>
    </BaseDialog>
    <RecipePageParseDialog
      :model-value="isParsing"
      :ingredients="recipe.recipeIngredient"
      :initial-parser="selectedParser"
      :width="$vuetify.display.smAndDown ? '100%' : '80%'"
      @update:model-value="toggleIsParsing"
      @save="saveParsedIngredients"
    />
    <v-container v-show="!isCookMode" key="recipe-page" class="px-0" :class="{ 'pa-0': $vuetify.display.smAndDown }">
      <v-card flat class="recipe-editor-shell d-print-none" color="transparent">
        <RecipePageHeader
          :recipe="recipe"
          :recipe-scale="scale"
          :landscape="landscape"
          @update:recipe="recipe = $event"
          @save="saveRecipe"
          @delete="deleteRecipe"
          @close="closeEditor"
        />
        <RecipeJsonEditor v-if="isEditJSON" v-model="recipe" class="mt-10" mode="text" :main-menu-bar="false" />
        <v-card-text v-else class="recipe-page-body">
          <!--
            This is where most of the main content is rendered. Some components include state for both Edit and View modes
            which is why some have explicit v-if statements and others use the composition API to determine and manage
            the shared state internally.

            The global recipe object is shared down the tree of components and _is_ mutated by child components. This is
            some-what of a hack of the system and goes against the principles of Vue, but it _does_ seem to work and streamline
            a significant amount of prop management. When we move to Vue 3 and have access to some of the newer API's the plan to update this
            data management and mutation system we're using.
          -->
          <div>
            <RecipePageInfoEditor v-if="isEditMode" v-model="recipe" />
          </div>
          <div>
            <RecipePageIngredientEditor v-if="isEditForm" v-model="recipe" @select-parser="startParsing" />
          </div>
          <!--
            This section contains the 2 column layout for the recipe steps and other content.
          -->
          <v-row>
            <!--
              The left column is conditionally rendered based on cook mode.
            -->
            <v-col
              v-if="!isCookMode || isEditForm"
              cols="12"
              sm="12"
              md="4"
              :class="$vuetify.display.mdAndUp ? 'border-e-thin' : null"
            >
              <RecipePageIngredientToolsView
                v-if="!isEditForm"
                v-model:scale="scale"
                :recipe="recipe"
                :ingredient-storage-key="ingredientStorageKey"
                class="pr-2"
              />
              <RecipePageOrganizers
                v-if="$vuetify.display.mdAndUp"
                v-model="recipe"
                class="pr-2"
                @item-selected="chipClicked"
              />
            </v-col>
            <!--
              the right column is always rendered, but it's layout width is determined by where the left column is
              rendered.
            -->
            <v-col cols="12" sm="12" :md="8 + (isCookMode ? 1 : 0) * 4">
              <RecipePageInstructions
                v-model="recipe.recipeInstructions"
                v-model:assets="recipe.assets"
                :recipe="recipe"
                :scale="scale"
                :ingredient-storage-key="ingredientStorageKey"
              >
                <template v-if="isEditForm" #footer>
                  <div class="d-flex justify-center">
                    <RecipeDialogBulkAdd
                      ref="domBulkAddDialog"
                      class="my-2"
                      style="display: none"
                      @bulk-data="addStep"
                    />
                    <div class="d-inline-flex my-2 recipe-section-add-action">
                      <v-btn color="primary" variant="tonal" class="split-main" @click="addStep()">
                        <v-icon start>
                          {{ $globals.icons.createAlt }}
                        </v-icon>
                        {{ $t("recipe.editor.add-step") }}
                      </v-btn>
                      <v-menu content-class="recipe-editor-overlay">
                        <template #activator="{ props }">
                          <v-btn color="primary" variant="tonal" class="split-dropdown" v-bind="props">
                            <v-icon>{{ $globals.icons.chevronDown }}</v-icon>
                          </v-btn>
                        </template>
                        <v-list>
                          <v-list-item
                            slim
                            density="comfortable"
                            :prepend-icon="$globals.icons.create"
                            :title="$t('new-recipe.bulk-add')"
                            @click="domBulkAddDialog?.open()"
                          />
                        </v-list>
                      </v-menu>
                    </div>
                  </div>
                </template>
              </RecipePageInstructions>
              <div v-if="!$vuetify.display.mdAndUp">
                <RecipePageOrganizers v-model="recipe" />
              </div>
              <RecipeNotes v-model="recipe.notes" v-model:assets="recipe.assets" :slug="recipe.slug" :recipe-id="recipe.id" :edit="isEditForm" />
            </v-col>
          </v-row>
          <RecipePageFooter v-model="recipe" />
        </v-card-text>
      </v-card>
      <RecipePageComments
        v-if="!disableComments && !isEditForm && !isCookMode"
        v-model="recipe"
        class="px-1 my-4 d-print-none"
      />
      <RecipePrintContainer :recipe="recipe" :scale="scale" />
    </v-container>
    <header v-if="isCookMode" class="cook-mode-toolbar">
      <div class="cook-mode-heading">
        <h1>{{ $t('recipe.cook-mode') }}</h1>
        <p>{{ recipe.name }}</p>
      </div>
      <RecipePageScale v-model="scale" :recipe="recipe" />
      <v-btn variant="tonal" color="primary" height="44" @click="toggleCookMode()">
        <v-icon start>
          {{ $globals.icons.close }}
        </v-icon>
        {{ $t('recipe.exit-cook-mode') }}
      </v-btn>
    </header>
    <!-- Cook mode displayes two columns with ingredients and instructions side by side, each being scrolled individually, allowing to view both at the same time -->
    <!-- Keep the cook panel within the viewport below the app bar and page gap. -->
    <v-sheet
      v-show="isCookMode && !hasLinkedIngredients"
      key="cookmode"
      :height="$vuetify.display.smAndUp ? 'calc(100dvh - var(--v-layout-top, 0px) - 140px)' : 'auto'"
      color="transparent"
      class="cook-mode-columns overflow-hidden"
    >
      <v-row style="height: 100%" no-gutters class="overflow-hidden">
        <v-col cols="12" sm="5" class="overflow-y-auto pl-4 pr-3 py-2" style="height: 100%">
          <h2 class="cook-section-title">
            {{ $t('recipe.ingredients') }}
          </h2>
          <RecipePageIngredientToolsView
            v-if="!isEditForm"
            v-model:scale="scale"
            :recipe="recipe"
            :is-cook-mode="isCookMode"
            :ingredient-storage-key="ingredientStorageKey"
          />
        </v-col>
        <v-col
          class="overflow-y-auto py-2"
          style="height: 100%"
          cols="12"
          sm="7"
        >
          <RecipePageInstructions
            v-model="recipe.recipeInstructions"
            v-model:assets="recipe.assets"
            class="overflow-y-hidden px-4"
            :recipe="recipe"
            :scale="scale"
            :ingredient-storage-key="ingredientStorageKey"
          />
        </v-col>
      </v-row>
    </v-sheet>
    <v-sheet v-show="isCookMode && hasLinkedIngredients" color="transparent" class="cook-mode-linked">
      <RecipePageInstructions
        v-model="recipe.recipeInstructions"
        v-model:assets="recipe.assets"
        class="overflow-y-hidden"
        :recipe="recipe"
        :scale="scale"
        :ingredient-storage-key="ingredientStorageKey"
      />

      <div v-if="notLinkedIngredients.length > 0" class="cook-extra-ingredients">
        <h2 class="cook-section-title">
          {{ $t("recipe.not-linked-ingredients") }}
        </h2>
        <v-card flat class="cook-ingredients-card">
          <RecipeIngredients
            :value="notLinkedIngredients"
            :scale="scale"
            :is-cook-mode="isCookMode"
            :storage-key="ingredientStorageKey"
          />
        </v-card>
      </div>
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
import { recipeView, type RecipeView } from "~/lib/recipe/recipe-view";
import "~/assets/recipe-editor.css";
import { invoke, until } from "@vueuse/core";
import type { RouteLocationNormalized } from "vue-router";
import RecipeIngredients from "../RecipeIngredients.vue";
import RecipePageFooter from "./RecipePageParts/RecipePageFooter.vue";
import RecipePageCreationCelebration from "./RecipePageParts/RecipePageCreationCelebration.vue";
import RecipePageHeader from "./RecipePageParts/RecipePageHeader.vue";
import RecipePageIngredientEditor from "./RecipePageParts/RecipePageIngredientEditor.vue";
import RecipePageIngredientToolsView from "./RecipePageParts/RecipePageIngredientToolsView.vue";
import RecipePageInstructions from "./RecipePageParts/RecipePageInstructions.vue";
import RecipePageOrganizers from "./RecipePageParts/RecipePageOrganizers.vue";
import RecipePageParseDialog from "./RecipePageParts/RecipeParseDialog/RecipePageParseDialog.vue";
import RecipePageScale from "./RecipePageParts/RecipePageScale.vue";
import RecipePageInfoEditor from "./RecipePageParts/RecipePageInfoEditor.vue";
import RecipePageComments from "./RecipePageParts/RecipePageComments.vue";
import RecipePrintContainer from "~/components/Domain/Recipe/RecipePrintContainer.vue";
import {
  clearPageState,
  PageMode,
  usePageState,
} from "~/composables/recipe-page/shared-state";
import { useCookModeQuery, type BooleanString } from "~/composables/recipe-page/use-cook-mode-query";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import type { Recipe, RecipeCategory, RecipeIngredient, RecipeTag, RecipeTool } from "~/lib/api/types/recipe";
import type { Parser } from "~/lib/api/user/recipes/recipe";
import { useRouteQuery } from "~/composables/use-router";
import { useUserApi } from "~/composables/api";
import { uuid4, deepCopy } from "~/composables/use-utils";
import RecipeDialogBulkAdd from "~/components/Domain/Recipe/RecipeDialogBulkAdd.vue";
import RecipeNotes from "~/components/Domain/Recipe/RecipeNotes.vue";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import { useNavigationWarning } from "~/composables/use-navigation-warning";
import { useHouseholdSelf } from "~/composables/use-households";
import { useAmbianceMusic } from "~/composables/use-ambiance-music";

const recipe = defineModel<RecipeView>({ required: true });

const display = useDisplay();
const auth = useMealieAuth();
const route = useRoute();
const { isOwnGroup } = useLoggedInState();

const { household } = useHouseholdSelf();

const disableComments = computed(() =>
  household.value?.preferences?.recipeDisableComments
  || recipe.value?.settings?.disableComments
  || false,
);

const groupSlug = computed(() => (route.params.groupSlug as string) || auth.user?.value?.groupSlug || "");
const ingredientStorageKey = computed(() => `recipe-ingredients:${recipe.value.id || recipe.value.slug}:checked`);

const router = useRouter();
const api = useUserApi();
const { pageMode, setMode, isEditForm, isEditJSON, isCookMode, isEditMode, isParsing, toggleCookMode, toggleIsParsing }
  = usePageState(recipe.value.slug);
const selectedParser = ref<Parser | null>(null);

function startParsing(parser: Parser) {
  selectedParser.value = parser;
  toggleIsParsing(true);
}
useAmbianceMusic(isCookMode, "assets/End_Creditouilles-Michael_Giacchino_cooking_mode.mp3");
const { deactivateNavigationWarning } = useNavigationWarning();
const domBulkAddDialog = ref<InstanceType<typeof RecipeDialogBulkAdd> | null>(null);
const notLinkedIngredients = computed(() => {
  return recipe.value.recipeIngredient.filter((ingredient) => {
    return !recipe.value.recipeInstructions.some(step =>
      step.ingredientReferences?.map(ref => ref.referenceId).includes(ingredient.referenceId),
    );
  });
});

/** =============================================================
 * Recipe Snapshot on Mount
 * this is used to determine if the recipe has been changed since the last save
 * and prompts the user to save if they have unsaved changes.
 */
const originalRecipe = ref<Recipe | null>(null);
const discardDialog = ref(false);
const pendingRoute = ref<RouteLocationNormalized | null>(null);

invoke(async () => {
  await until(recipe.value).not.toBeNull();
  originalRecipe.value = deepCopy(recipe.value);
});

function hasUnsavedChanges(): boolean {
  if (originalRecipe.value === null) {
    return false;
  }
  return JSON.stringify(recipe.value) !== JSON.stringify(originalRecipe.value);
}

function restoreOriginalRecipe() {
  if (originalRecipe.value) {
    recipe.value = recipeView(deepCopy(originalRecipe.value));
  }
}

function closeEditor() {
  if (hasUnsavedChanges()) {
    pendingRoute.value = null;
    discardDialog.value = true;
  }
  else {
    setMode(PageMode.VIEW);
  }
}

function confirmDiscard() {
  restoreOriginalRecipe();
  discardDialog.value = false;

  if (pendingRoute.value) {
    const destination = pendingRoute.value;
    pendingRoute.value = null;
    router.push(destination);
  }
  else {
    setMode(PageMode.VIEW);
  }
}

function cancelDiscard() {
  discardDialog.value = false;
  pendingRoute.value = null;
}

onBeforeRouteLeave((to) => {
  if (isEditMode.value && hasUnsavedChanges()) {
    pendingRoute.value = to;
    discardDialog.value = true;
    return false;
  }
});

onUnmounted(() => {
  deactivateNavigationWarning();
  clearPageState(recipe.value.slug || "");
});
const hasLinkedIngredients = computed(() => {
  return recipe.value.recipeInstructions.some(
    step => step.ingredientReferences && step.ingredientReferences.length > 0,
  );
});
/** =============================================================
 * Set State onMounted
 */

const paramsEdit = useRouteQuery<BooleanString>("edit", "");
const paramsParse = useRouteQuery<BooleanString>("parse", "");
const paramsCook = useRouteQuery<BooleanString>("cook", "");
const paramsCelebrate = useRouteQuery<BooleanString>("celebrate", "");
const showCreationCelebration = ref(false);
const { hydrateCookMode } = useCookModeQuery({
  cookQuery: paramsCook,
  isEditMode,
  pageMode,
  setMode,
});

onMounted(() => {
  if (paramsEdit.value === "true" && isOwnGroup.value) {
    setMode(PageMode.EDIT);
  }

  if (paramsParse.value === "true" && isOwnGroup.value) {
    toggleIsParsing(true);
  }

  if (paramsCelebrate.value === "true" && isOwnGroup.value) {
    showCreationCelebration.value = true;
    paramsCelebrate.value = undefined;
  }

  hydrateCookMode();
});

// When set, the isEditMode watcher skips its URL cleanup because saveRecipe
// is navigating to a new slug that naturally omits ?edit=true.
const isNavigatingAfterRename = ref(false);

watch(isEditMode, (newVal) => {
  if (!newVal) {
    if (isNavigatingAfterRename.value) {
      isNavigatingAfterRename.value = false;
      return;
    }
    paramsEdit.value = undefined;
  }
});

watch(isParsing, () => {
  if (!isParsing.value) {
    paramsParse.value = undefined;
  }
});

/** =============================================================
 * Recipe Save Delete
 */

async function saveRecipe() {
  const { data, error } = await api.recipes.updateOne(recipe.value.slug, recipe.value);
  if (!error) {
    if (data?.slug && data.slug !== route.params.slug) {
      isNavigatingAfterRename.value = true;
    }
    setMode(PageMode.VIEW);
  }
  if (data?.slug) {
    recipe.value = recipeView(data);
    originalRecipe.value = deepCopy(recipe.value);
    if (data.slug !== route.params.slug) {
      router.replace(`/g/${groupSlug.value}/r/` + data.slug);
    }
  }
}

async function saveParsedIngredients(ingredients: NoUndefinedField<RecipeIngredient[]>) {
  const returnToEdit = isEditMode.value;
  recipe.value.recipeIngredient = ingredients;
  await saveRecipe();
  toggleIsParsing(false);
  if (returnToEdit) {
    setMode(PageMode.EDIT);
  }
}

async function deleteRecipe() {
  const { data } = await api.recipes.deleteOne(recipe.value.slug);
  if (data?.slug) {
    router.push(`/g/${groupSlug.value}`);
  }
}

/** =============================================================
 * View Preferences
 */
const landscape = computed(() => {
  const preferLandscape = recipe.value.settings?.landscapeView;
  const smallScreen = !display.smAndUp.value;

  if (preferLandscape) {
    return true;
  }
  else if (smallScreen) {
    return true;
  }

  return false;
});

/** =============================================================
 * Bulk Step Editor
 * TODO: Move to RecipePageInstructions component
 */

function addStep(steps: Array<string> | null = null) {
  if (!recipe.value.recipeInstructions) {
    return;
  }

  if (steps) {
    const cleanedSteps = steps.map((step) => {
      return { id: uuid4(), text: step, title: "", summary: "", ingredientReferences: [], noteReferences: [] };
    });

    recipe.value.recipeInstructions.push(...cleanedSteps);
  }
  else {
    recipe.value.recipeInstructions.push({
      id: uuid4(),
      text: "",
      title: "",
      summary: "",
      ingredientReferences: [],
      noteReferences: [],
    });
  }
}

/** =============================================================
 * RecipeChip Clicked
 */

function chipClicked(item: RecipeTag | RecipeCategory | RecipeTool, itemType: string) {
  if (!item.id) {
    return;
  }
  router.push(`/g/${groupSlug.value}?${itemType}=${item.id}`);
}

const scale = ref(1);

// expose to template
// (all variables used in template are top-level in <script setup>)
</script>

<style lang="css">
.flip-list-move {
  transition: transform 0.5s;
}

.no-move {
  transition: transform 0s;
}

.ghost {
  opacity: 0.5;
}

.list-group {
  min-height: 38px;
}

.list-group-item i {
  cursor: pointer;
}

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
.cook-mode-surface {
  position: relative;
}
</style>
