<template>
  <v-container fluid class="pa-0">
    <RecipeDialogAddToShoppingList
      v-if="shoppingLists"
      v-model="shoppingListDialog"
      :recipes="shoppingListRecipes"
      :shopping-lists="shoppingLists"
    />
    <GroupMealPlanEntryDialog
      v-model="dialog.open"
      :entry="dialog.entry"
      :date="dialog.date"
      @create="actions.createOne($event)"
      @update="actions.updateOne($event)"
    />
    <MealPlanLayout :mealplans="mealplans">
      <template #default="{ day }">
        <MealPlanDay :day="day.date" :actions="actions" :recipes="day.recipes">
          <template #default="{ buttons, bindings }">
            <SpinTransition>
              <v-card
                color="surface-variant"
                variant="flat"
                class="planner-day-menu pl-4 pr-2"
                style="background: rgb(var(--v-theme-surface-variant)) !important;"
              >
                <p v-if="!day.sections.length && !loading && !dragging" class="text-secondary-label text-center py-2">
                  {{ $t('meal-plan.no-meal-planned') }}
                </p>
                <SpinTransition>
                  <div v-for="section in planTypes" v-show="dragging || slots[dateKey(day.date)]?.[section.value]?.length" :key="section.value">
                    <div class="py-2 d-flex flex-column">
                      <p class="planner-course-label my-0">
                        {{ section.text }}
                      </p>
                    </div>
                    <VueDraggable
                      v-if="slots[dateKey(day.date)]?.[section.value]"
                      :model-value="mealsFor(day.date, section.value)"
                      group="planner-meals"
                      handle=".planner-drag-handle"
                      :sort="false"
                      :disabled="saving || loading"
                      :animation="180"
                      :delay="200"
                      :delay-on-touch-only="true"
                      :touch-start-threshold="5"
                      ghost-class="recipe-drop-target"
                      chosen-class="recipe-drag-chosen"
                      drag-class="recipe-drag-active"
                      class="planner-drop-zone"
                      :class="{ 'planner-drop-zone-active': dragging }"
                      :data-date="dateKey(day.date)"
                      :data-type="section.value"
                      @update:model-value="setMealsFor(day.date, section.value, $event)"
                      @start="dragging = true"
                      @end="finishMove"
                    >
                      <div v-for="mealplan in mealsFor(day.date, section.value)" :key="mealplan.id" :data-meal-id="mealplan.id" class="planner-meal-drag-item">
                        <v-btn
                          icon
                          variant="text"
                          color="text-secondary"
                          class="planner-drag-handle"
                          :ripple="false"
                          :aria-label="$t('meal-plan.drag-meal')"
                          :title="$t('meal-plan.drag-meal')"
                          @click.stop
                        >
                          <v-icon :icon="$globals.icons.arrowUpDown" size="18" />
                        </v-btn>
                        <RecipeCardMobile
                          :recipe-id="mealplan.recipe ? mealplan.recipe.id! : ''"
                          class="planner-meal-card"
                          compact
                          :rating="mealplan.recipe ? mealplan.recipe.rating! : 0"
                          :slug="mealplan.recipe ? mealplan.recipe.slug! : mealplan.title!"
                          :description="mealplan.recipe ? mealplan.recipe.description! : mealplan.text!"
                          :show-description="!mealplan.recipe"
                          :name="mealplan.recipe ? mealplan.recipe.name! : mealplan.title!"
                          :image="mealplan.recipe ? mealplan.recipe.image! : undefined"
                          :tags="mealplan.recipe ? mealplan.recipe.tags! : []"
                          @mealplan-remove="actions.deleteOne(mealplan.id)"
                          @mealplan-edit="editMeal(mealplan)"
                          @add-to-shopping-list="addMealToShoppingList(mealplan)"
                        />
                      </div>
                    </VueDraggable>
                  </div>
                </SpinTransition>
                <div class="planner-day-actions d-flex justify-center">
                  <BaseButtonGroup v-bind="bindings" :buttons="buttons" />
                </div>
              </v-card>
            </SpinTransition>
          </template>
        </MealPlanDay>
      </template>
    </MealPlanLayout>
  </v-container>
</template>

<script setup lang="ts">
import { format } from "date-fns";
import { VueDraggable } from "vue-draggable-plus";
import type { SortableEvent } from "sortablejs";
import { useMealplanDrag } from "~/composables/use-mealplan-drag";
import { usePlanTypeOptions } from "~/composables/use-group-mealplan";
import { useUserApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";
import type { PlanEntryType, ReadPlanEntry } from "~/lib/api/types/meal-plan";
import RecipeDialogAddToShoppingList from "~/components/Domain/Recipe/RecipeDialogAddToShoppingList.vue";
import RecipeCardMobile from "~/components/Domain/Recipe/RecipeCardMobile.vue";
import { useAddToShoppingListDialog } from "~/composables/shopping-list-page/use-add-to-shopping-list-dialog";
import type { MealsByDate } from "~/composables/use-group-mealplan";

const props = defineProps<{
  mealplans: MealsByDate[];
  actions: ReturnType<typeof useMealplans>["actions"];
  loading?: boolean;
}>();

const planTypes = usePlanTypeOptions();
const api = useUserApi();
const i18n = useI18n();
const dateKey = (date: Date) => format(date, "yyyy-MM-dd");
const { slots, dragging, saving, move } = useMealplanDrag(
  () => props.mealplans,
  planTypes.map(type => type.value),
  async entry => !!(await api.mealplans.updateOne(entry.id, entry)).data,
  () => props.actions.refreshAll(),
  () => alert.error(i18n.t("meal-plan.move-failed")),
);
function finishMove(event: SortableEvent) {
  const date = event.to.dataset.date;
  const type = event.to.dataset.type as PlanEntryType | undefined;
  if (date && type) void move(Number(event.item.dataset.mealId), date, type);
  else dragging.value = false;
}
function mealsFor(date: Date, type: PlanEntryType) {
  return slots[dateKey(date)]?.[type] ?? [];
}
function setMealsFor(date: Date, type: PlanEntryType, meals: ReadPlanEntry[]) {
  const day = slots[dateKey(date)];
  if (day) day[type] = meals;
}
const { open: shoppingListDialog, shoppingLists, getShoppingLists } = useAddToShoppingListDialog();

const dialog = reactive({
  open: false,
  entry: null as ReadPlanEntry | null,
  date: null as Date | null,
});
const shoppingListMeal = ref<ReadPlanEntry | null>(null);
const shoppingListRecipes = computed(() => {
  const recipe = shoppingListMeal.value?.recipe;
  return recipe ? [{ scale: 1, ...recipe }] : [];
});

async function addMealToShoppingList(mealplan: ReadPlanEntry) {
  if (!mealplan.recipe) return;

  shoppingListMeal.value = mealplan;
  await getShoppingLists();
  shoppingListDialog.value = true;
}

function editMeal(mealplan: ReadPlanEntry) {
  if (!mealplan.entryType) return;

  dialog.entry = mealplan;
  dialog.date = null;
  dialog.open = true;
}
</script>

<style scoped>
/*
  RecipeCardMobile lays out a fixed-width thumbnail + a favorite/rating/menu action row
  side-by-side. Below ~320px the action row no longer fits and the "..." menu button gets
  clipped by the card's overflow:hidden. Enforcing a min-width here makes the day columns
  wrap to fewer per row instead of shrinking past that point.
*/
.col-borders {
  min-width: 340px;
}
.planner-drop-zone {
  min-height: 48px;
  border-radius: 12px;
}
.planner-drop-zone-active {
  outline: 1px dashed rgba(var(--v-theme-primary), 0.5);
  background: rgba(var(--v-theme-primary), 0.05);
}
.planner-meal-drag-item {
  position: relative;
  padding-left: 32px;
  margin-bottom: 8px;
}
.planner-drag-handle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: -6px;
  width: 38px;
  height: 44px;
  cursor: grab;
  touch-action: none;
}
.planner-drag-handle :deep(.v-btn__overlay),
.planner-drag-handle :deep(.v-btn__underlay) {
  display: none;
}
.planner-drag-handle:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
  border-radius: 10px;
}
.planner-drag-handle:active {
  cursor: grabbing;
}
.recipe-drop-target {
  outline: 2px dashed rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.12);
  border-radius: 12px;
}
.recipe-drag-chosen {
  opacity: 0.8;
}
.recipe-drag-active {
  opacity: 0.6;
}
</style>
