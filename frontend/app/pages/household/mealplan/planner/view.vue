<template>
  <v-container fluid class="pa-0">
    <GroupMealPlanEntryDialog v-model="dialog.open" :entry="dialog.entry" :date="dialog.date"
      @create="actions.createOne($event)" @update="actions.updateOne($event)" />
    <MealPlanLayout :mealplans="mealplans">
      <template #default="{ day }">
        <MealPlanDay :day="day.date" :actions="actions" :recipes="day.recipes">
          <template #default="{ buttons, bindings }">
            <SpinTransition>
              <v-card v-if="day.sections.length" color="surface-variant" variant="flat"
                class="planner-day-menu pl-4 pr-2" style="background: rgb(var(--v-theme-surface-variant)) !important;">
                <SpinTransition>
                  <div v-for="section in day.sections" :key="section.title">
                    <div class="py-2 d-flex flex-column">
                      <p class="planner-course-label my-0">
                        {{ section.title }}
                      </p>
                    </div>
                    <SpinTransition>
                      <RecipeCardMobile v-for="mealplan in section.meals" :key="mealplan.id"
                        :recipe-id="mealplan.recipe ? mealplan.recipe.id! : ''" class="planner-meal-card mb-2"
                        :rating="mealplan.recipe ? mealplan.recipe.rating! : 0"
                        :slug="mealplan.recipe ? mealplan.recipe.slug! : mealplan.title!"
                        :description="mealplan.recipe ? mealplan.recipe.description! : mealplan.text!"
                        :show-description="!mealplan.recipe"
                        :name="mealplan.recipe ? mealplan.recipe.name! : mealplan.title!"
                        :image="mealplan.recipe ? mealplan.recipe.image! : undefined"
                        :tags="mealplan.recipe ? mealplan.recipe.tags! : []" :context-menu-leading-items="[
                          {
                            title: $t('meal-plan.remove-from-plan'),
                            icon: $globals.icons.calendarRemove,
                            color: undefined,
                            event: 'mealplanRemove',
                            isPublic: false,
                          },
                          {
                            title: $t('meal-plan.edit-meal-plan'),
                            icon: $globals.icons.calendarEdit,
                            color: undefined,
                            event: 'mealplanEdit',
                            isPublic: false,
                          },
                        ]" @mealplan-remove="actions.deleteOne(mealplan.id)" @mealplan-edit="editMeal(mealplan)">
                        <template v-if="!mealplan.recipe" #context-menu>
                          <MealPlanNoteMenu @mealplan-remove="actions.deleteOne(mealplan.id)"
                            @mealplan-edit="editMeal(mealplan)" />
                        </template>
                      </RecipeCardMobile>
                    </SpinTransition>
                  </div>
                </SpinTransition>
                <div class="planner-day-actions d-flex justify-center">
                  <BaseButtonGroup v-bind="bindings" :buttons="buttons" />
                </div>
              </v-card>
              <v-card v-else color="surface-variant" variant="flat" class="planner-empty-day"
                style="background: rgb(var(--v-theme-surface-variant)) !important;">
                <p>{{ $t('meal-plan.no-meal-planned') }}</p>
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
import MealPlanNoteMenu from "~/components/Domain/Mealplan/MealPlanNoteMenu.vue";
import RecipeCardMobile from "~/components/Domain/Recipe/RecipeCardMobile.vue";
import type { MealsByDate } from "~/composables/use-group-mealplan";
import type { ReadPlanEntry } from "~/lib/api/types/meal-plan";

defineProps<{
  mealplans: MealsByDate[];
  actions: ReturnType<typeof useMealplans>["actions"];
}>();

const dialog = reactive({
  open: false,
  entry: null as ReadPlanEntry | null,
  date: null as Date | null,
});

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
</style>
