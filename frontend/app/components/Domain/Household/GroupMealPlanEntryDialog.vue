<template>
  <BaseDialog v-model="dialog"
    :title="entry ? $t('meal-plan.update-this-meal-plan') : $t('meal-plan.create-a-new-meal-plan')"
    :submit-text="entry ? $t('general.update') : $t('general.create')" :hide-submit-icon="!!entry"
    :submit-disabled="submitDisabled" color="primary" width="1000" center-title cancel-in-toolbar can-submit
    expand-card-actions-left disable-submit-on-enter @submit="submit">
    <v-card-text>
      <v-row>
        <v-col cols="12" md="5">
          <MealPlanDatePicker v-model="selectedDate" :entry-type="entryType" />
        </v-col>

        <!-- both modes fill the same pane, so the dialog doesn't resize when switching between them -->
        <v-col cols="12" md="7" class="entry-detail">
          <v-tabs v-model="entryMode" color="primary" grow class="entry-detail__tabs mb-4">
            <v-tab value="recipe">
              <v-icon start>
                {{ $globals.icons.silverwareForkKnife }}
              </v-icon>
              {{ $t("general.recipe") }}
            </v-tab>
            <v-tab value="note">
              <v-icon start>
                {{ $globals.icons.textBox }}
              </v-icon>
              {{ $t("meal-plan.note") }}
            </v-tab>
          </v-tabs>

          <div class="entry-detail__content">
            <RecipeSelector v-if="isRecipe" ref="selector" v-model="recipe" class="flex-grow-1"
              :query-filter="ruleQueryFilter" :show-selected="false">
              <template #filters>
                <v-switch v-model="ignoreRules" class="ignore-rules-switch flex-grow-0 ms-auto" color="primary"
                  density="compact" hide-details :disabled="!applicableRuleFilter"
                  :label="$t('meal-plan.ignore-rules')" />
              </template>

              <template #no-results>
                <v-alert v-if="ruleQueryFilter" type="info" variant="tonal">
                  <div>{{ $t("meal-plan.no-recipes-match-your-rules") }}</div>
                  <v-btn class="mt-2" size="small" color="info" variant="tonal" @click="ignoreRules = true">
                    {{ $t("meal-plan.ignore-rules") }}
                  </v-btn>
                </v-alert>
                <BaseNoResultsAlert v-else :text="$t('search.no-results')" />
              </template>
            </RecipeSelector>

            <div v-else>
              <v-text-field v-model="title" :label="$t('meal-plan.meal-title')" :rules="[validators.required]" />
              <v-textarea v-model="text" :label="$t('meal-plan.meal-note')" rows="6" />
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
    <template #card-actions-left>
      <RecipeCardLineItem v-if="isRecipe && recipe" class="selected-recipe meal-plan-footer-selection" :recipe="recipe"
        disable-link>
        <template #append>
          <v-btn icon variant="text" color="error" size="small" aria-label="Remove selected recipe"
            title="Remove selected recipe" @click.stop="recipe = null">
            <v-icon>{{ $globals.icons.close }}</v-icon>
          </v-btn>
        </template>
      </RecipeCardLineItem>
      <v-list-item v-else-if="isRecipe" class="selection-placeholder meal-plan-footer-selection">
        <template #prepend>
          <v-avatar rounded="lg" width="56" height="40" color="surface-variant">
            <v-icon>{{ $globals.icons.silverwareForkKnife }}</v-icon>
          </v-avatar>
        </template>
        <v-list-item-title>{{ $t("meal-plan.select-meal-below") }}</v-list-item-title>
      </v-list-item>
    </template>
    <template #custom-card-action>
      <v-select v-model="entryType" class="meal-type-footer" :items="planTypeOptions" :label="$t('recipe.entry-type')"
        item-title="text" item-value="value" :return-object="false" hide-details density="compact" variant="outlined"
        :disabled="submitDisabled" />
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { format } from "date-fns";
import RecipeCardLineItem from "~/components/Domain/Recipe/RecipeCardLineItem.vue";
import RecipeSelector from "~/components/Domain/Recipe/RecipeSelector.vue";
import { usePlanTypeOptions } from "~/composables/use-group-mealplan";
import { buildRuleQueryFilter, useMealplanRules } from "~/composables/use-mealplan-rules";
import { validators } from "~/composables/use-validators";
import type { CreatePlanEntry, PlanEntryType, ReadPlanEntry, UpdatePlanEntry } from "~/lib/api/types/meal-plan";
import type { RecipeSummary } from "~/lib/api/types/recipe";

interface Props {
  entry?: ReadPlanEntry | null;
  date?: Date | null;
}
const props = withDefaults(defineProps<Props>(), {
  entry: null,
  date: null,
});

const emit = defineEmits<{
  create: [payload: CreatePlanEntry];
  update: [payload: UpdatePlanEntry];
}>();

const dialog = defineModel<boolean>({ required: true });

const { rules } = useMealplanRules();
const planTypeOptions = usePlanTypeOptions();

const selector = ref<InstanceType<typeof RecipeSelector> | null>(null);

const entryMode = ref<"recipe" | "note">("recipe");
const selectedDate = ref(new Date());
const entryType = ref<PlanEntryType>("dinner");
const recipe = ref<RecipeSummary | null>(null);
const title = ref("");
const text = ref("");
const ignoreRules = ref(false);

const isRecipe = computed(() => entryMode.value === "recipe");

const applicableRuleFilter = computed(() => buildRuleQueryFilter(rules.value, selectedDate.value, entryType.value));
const ruleQueryFilter = computed(() => ignoreRules.value ? null : applicableRuleFilter.value);

const submitDisabled = computed(() => isRecipe.value ? !recipe.value : !title.value.trim());

function parseEntryDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function initialize() {
  entryMode.value = props.entry && !props.entry.recipeId ? "note" : "recipe";
  selectedDate.value = props.entry ? parseEntryDate(props.entry.date) : props.date ?? new Date();
  entryType.value = props.entry?.entryType ?? "dinner";
  recipe.value = props.entry?.recipe ?? null;
  title.value = props.entry?.title ?? "";
  text.value = props.entry?.text ?? "";
  ignoreRules.value = false;
  selector.value?.reset();
}

function submit() {
  const payload = {
    date: format(selectedDate.value, "yyyy-MM-dd"),
    entryType: entryType.value,
    title: isRecipe.value ? "" : title.value,
    text: isRecipe.value ? "" : text.value,
    recipeId: isRecipe.value ? recipe.value?.id : null,
  };

  if (props.entry) {
    emit("update", {
      ...payload,
      id: props.entry.id,
      groupId: props.entry.groupId,
      userId: props.entry.userId,
    });
  }
  else {
    emit("create", payload);
  }
}

watch(dialog, (isOpen) => {
  if (isOpen) {
    initialize();
  }
});
</script>

<style scoped>
.entry-detail {
  display: flex;
  flex-direction: column;
  min-height: clamp(320px, 45vh, 520px);
}

.entry-detail__tabs {
  flex: 0 0 auto;
}

.entry-detail__content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.entry-detail__content>* {
  min-height: 0;
}

.meal-type-footer {
  flex: 0 0 150px;
  min-width: 150px;
  max-width: 150px;
  width: 150px !important;
  --v-input-control-height: 32px;
}

.meal-plan-footer-selection {
  flex: 1 1 auto;
  min-width: 0;
}

.meal-plan-footer-selection :deep(.v-list-item__content) {
  min-width: 0;
}

.selected-recipe {
  color: rgb(var(--v-theme-error));
  background-color: rgb(var(--v-theme-error) / 0.12);
}

.selection-placeholder {
  min-height: 56px;
}

/* v-switch reserves a taller control than the filter buttons next to it */
.ignore-rules-switch {
  --v-input-control-height: 28px;
  align-self: flex-start;
}
</style>
