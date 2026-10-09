<template>
  <BaseDialog
    v-model="dialog"
    :title="entry ? $t('meal-plan.update-this-meal-plan') : $t('meal-plan.create-a-new-meal-plan')"
    width="100%"
    max-width="1000px"
    content-class="meal-entry-dialog"
    cancel-in-toolbar
    disable-submit-on-enter
  >
    <div class="meal-entry-content">
      <section class="meal-entry-schedule" :aria-label="$t('meal-plan.when')">
        <h2>{{ $t('meal-plan.when') }}</h2>
        <MealPlanDatePicker v-model="selectedDate" :entry-type="entryType" calm />
        <v-select
          v-model="entryType"
          class="meal-entry-type"
          :items="planTypeOptions"
          :label="$t('meal-plan.meal-type')"
          item-title="text"
          item-value="value"
          variant="outlined"
          density="comfortable"
          hide-details
          :menu-props="{ contentClass: 'recipe-editor-overlay' }"
        />
      </section>
      <section class="entry-detail" :aria-label="$t('meal-plan.meal-content')">
        <v-tabs v-model="entryMode" color="primary" grow class="entry-detail__tabs">
          <v-tab value="recipe">
            <v-icon start>
              {{ $globals.icons.silverwareForkKnife }}
            </v-icon>{{ $t('general.recipe') }}
          </v-tab>
          <v-tab value="note">
            <v-icon start>
              {{ $globals.icons.textBox }}
            </v-icon>{{ $t('meal-plan.free-meal') }}
          </v-tab>
        </v-tabs>
        <div class="entry-detail__content">
          <RecipeSelector
            v-if="isRecipe"
            ref="selector"
            v-model="recipe"
            calm
            :query-filter="ruleQueryFilter"
            :show-selected="false"
          >
            <template v-if="applicableRuleFilter" #filters>
              <v-switch
                v-model="ignoreRules"
                class="ignore-rules-switch"
                color="primary"
                density="compact"
                hide-details
                :label="$t('meal-plan.ignore-rules-short')"
              />
            </template>
            <template #no-results>
              <BaseEmptyState :message="ruleQueryFilter ? $t('meal-plan.no-recipes-match-your-rules') : $t('search.no-results')" :icon="$globals.icons.search" />
              <v-btn
                v-if="ruleQueryFilter"
                class="mt-3"
                variant="tonal"
                color="primary"
                height="44"
                @click="ignoreRules = true"
              >
                {{ $t('meal-plan.ignore-rules-short') }}
              </v-btn>
            </template>
          </RecipeSelector>
          <div v-else class="meal-entry-note">
            <p class="meal-entry-hint">
              {{ $t('meal-plan.free-meal-description') }}
            </p>
            <v-text-field v-model="title" :label="$t('meal-plan.meal-title')" :rules="[validators.required]" variant="outlined" hide-details="auto" />
            <v-textarea
              v-model="text"
              :label="$t('meal-plan.optional-meal-note')"
              rows="4"
              auto-grow
              variant="outlined"
              hide-details="auto"
            />
          </div>
        </div>
      </section>
    </div>
    <template #card-actions>
      <div class="meal-entry-footer">
        <div class="meal-entry-selection">
          <RecipeCardLineItem v-if="isRecipe && recipe" :recipe="recipe" disable-link>
            <template #append>
              <v-btn
                icon
                variant="text"
                color="error"
                size="small"
                :aria-label="$t('meal-plan.clear-recipe')"
                :title="$t('meal-plan.clear-recipe')"
                @click.stop="recipe = null"
              >
                <v-icon>{{ $globals.icons.close }}</v-icon>
              </v-btn>
            </template>
          </RecipeCardLineItem>
          <p v-else-if="isRecipe" class="meal-entry-hint">
            {{ $t('meal-plan.select-meal-below') }}
          </p>
        </div>
        <div class="meal-entry-actions">
          <BaseButton
            variant="tonal"
            color="primary"
            height="44"
            :icon="entry ? $globals.icons.save : $globals.icons.create"
            :disabled="submitDisabled"
            :text="entry ? $t('meal-plan.save-meal') : $t('meal-plan.create-meal')"
            @click="submitAndClose"
          />
        </div>
      </div>
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
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
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

function submitAndClose() {
  if (submitDisabled.value) return;
  submit();
  dialog.value = false;
}

function submit() {
  if (submitDisabled.value) return;
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
}, { immediate: true });
</script>

<style scoped>
.meal-entry-content {
  display: grid;
  grid-template-columns: 328px minmax(0, 1fr);
  gap: 24px;
  padding: 24px;
  font-family: var(--bistro-body);
}
.meal-entry-schedule {
  min-width: 0;
}
.meal-entry-schedule h2 {
  font-family: var(--bistro-body) !important;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: normal;
  margin: 0 0 12px;
}
.meal-entry-type {
  margin-top: 16px;
}
.entry-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.entry-detail__tabs {
  flex: 0 0 auto;
  margin-bottom: 16px;
}
.entry-detail__content {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: clamp(320px, 50vh, 480px);
}
.entry-detail__content > * {
  min-height: 0;
}
.meal-entry-note {
  display: grid;
  gap: 16px;
  overflow-y: auto;
  padding-top: 4px;
}
.meal-entry-hint {
  font-size: 14px;
  line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin: 0;
}
.ignore-rules-switch {
  width: 100%;
  flex: 0 0 auto;
}
.meal-entry-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-width: 0;
}
.meal-entry-selection {
  flex: 1;
  min-width: 0;
}
.meal-entry-selection :deep(.v-list-item) {
  background: rgb(var(--v-theme-fill));
  border-radius: 12px;
  padding: 8px 12px;
}
.meal-entry-selection :deep(.v-list-item-title) {
  font-family: var(--bistro-body);
  font-size: 14px;
}
.meal-entry-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
@container meal-entry (max-width: 850px) {
  .meal-entry-content {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 24px;
  }
  .meal-entry-schedule {
    max-width: 376px;
    width: 100%;
    margin-inline: auto;
  }
  .entry-detail__content {
    height: 360px;
  }
  .meal-entry-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .meal-entry-actions {
    justify-content: flex-end;
    flex-wrap: wrap;
  }
  .meal-entry-selection:empty {
    display: none;
  }
}
</style>

<style>
.meal-entry-dialog .base-dialog-card {
  container: meal-entry / inline-size;
}
.meal-entry-dialog .base-dialog-card .dialog-title {
  font-family: var(--bistro-body) !important;
  letter-spacing: normal;
}
.meal-entry-dialog .base-dialog-card .v-btn:not(.v-btn--icon) {
  border-radius: 10px;
  text-transform: none;
  letter-spacing: normal;
}
.meal-entry-dialog .base-dialog-card > .v-card-actions {
  padding: 16px 24px;
}
@media (max-width: 600px) {
  .meal-entry-dialog .base-dialog-card > .v-card-actions {
    display: flex;
    padding: 16px;
  }
}
</style>
