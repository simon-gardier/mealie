<template>
  <v-container class="lg-container">
    <BasePageTitle divider>
      <template #header>
        <v-img
          width="100%"
          max-height="100"
          max-width="100"
          src="/svgs/manage-cookbooks.svg"
        />
      </template>
      <template #title>
        {{ $t('meal-plan.meal-plan-rules') }}
      </template>
      {{ $t('meal-plan.meal-plan-rules-description') }}
    </BasePageTitle>

    <section class="meal-rule-create">
      <h2 class="meal-rule-heading">
        {{ $t('meal-plan.new-rule') }}
      </h2>
      <p class="text-secondary mb-6">
        {{ $t('meal-plan.new-rule-description') }}
      </p>
      <GroupMealPlanRuleForm
        :key="createDataFormKey"
        v-model:day="createData.day"
        v-model:entry-type="createData.entryType"
        v-model:query-filter-string="createData.queryFilterString"
        class="mt-2"
      />
      <div class="d-flex justify-end mt-6">
        <BaseButton
          create
          variant="tonal"
          :loading="createPending"
          :disabled="createPending || !createData.queryFilterString"
          @click="createRule"
        />
      </div>
    </section>

    <section>
      <BaseCardSectionTitle
        class="mt-10"
        :title="$t('meal-plan.recipe-rules')"
      />
      <div>
        <div
          v-for="rule in allRules"
          :key="rule.id"
        >
          <v-card class="my-3" elevation="0">
            <v-card-title class="meal-rule-title">
              <span>
                {{ rule.day === "unset" ? $t('meal-plan.applies-to-all-days') : $t('meal-plan.applies-on-days', [$t('general.' + rule.day)]) }}
                {{ rule.entryType === "unset" ? $t('meal-plan.for-all-meal-types') : $t('meal-plan.for-type-meal-types', [$t('meal-plan.' + rule.entryType)]) }}
              </span>
              <span class="ml-auto">
                <BaseButtonGroup
                  :buttons="[
                    {
                      icon: $globals.icons.edit,
                      text: $t('general.edit'),
                      event: 'edit',
                    },
                    {
                      icon: $globals.icons.delete,
                      text: $t('general.delete'),
                      event: 'delete',
                    },
                  ]"
                  @delete="deleteRule(rule.id)"
                  @edit="toggleEditState(rule.id)"
                />
              </span>
            </v-card-title>
            <v-card-text>
              <template v-if="!editState[rule.id]">
                <p class="text-secondary" style="overflow-wrap: anywhere">
                  {{ rule.queryFilterString }}
                </p>
              </template>
              <template v-else>
                <GroupMealPlanRuleForm
                  v-model:day="rule.day"
                  v-model:entry-type="rule.entryType"
                  v-model:query-filter-string="rule.queryFilterString"
                  :query-filter="rule.queryFilter"
                />
                <div class="d-flex justify-end">
                  <BaseButton
                    update
                    :disabled="!rule.queryFilterString"
                    @click="updateRule(rule)"
                  />
                </div>
              </template>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </section>
  </v-container>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import type { PlanRulesCreate, PlanRulesOut } from "~/lib/api/types/meal-plan";
import GroupMealPlanRuleForm from "~/components/Domain/Household/GroupMealPlanRuleForm.vue";
import { useAsyncKey } from "~/composables/use-utils";

const api = useUserApi();
const i18n = useI18n();

useSeoMeta({
  title: i18n.t("meal-plan.meal-plan-settings"),
});

// ======================================================
// Manage All
const editState = ref<{ [key: string]: boolean }>({});
const allRules = ref<PlanRulesOut[]>([]);

function toggleEditState(id: string) {
  editState.value[id] = !editState.value[id];
  editState.value = { ...editState.value };
}

async function refreshAll() {
  const { data } = await api.mealplanRules.getAll();

  if (data) {
    allRules.value = data.items ?? [];
  }
}

useAsyncData(useAsyncKey(), async () => {
  await refreshAll();
});

// ======================================================
// Creating Rules

const createDataFormKey = ref(0);
const createPending = ref(false);
const createData = ref<PlanRulesCreate>({
  entryType: "unset",
  day: "unset",
  queryFilterString: "",
});

async function createRule() {
  if (createPending.value || !createData.value.queryFilterString) return;
  createPending.value = true;
  try {
    const { data } = await api.mealplanRules.createOne(createData.value);
    if (data) {
      refreshAll();
      createData.value = {
        entryType: "unset",
        day: "unset",
        queryFilterString: "",
      };
      createDataFormKey.value++;
    }
  }
  finally { createPending.value = false; }
}

async function deleteRule(ruleId: string) {
  const { data } = await api.mealplanRules.deleteOne(ruleId);
  if (data) {
    refreshAll();
  }
}

async function updateRule(rule: PlanRulesOut) {
  const { data } = await api.mealplanRules.updateOne(rule.id, rule);
  if (data) {
    refreshAll();
    toggleEditState(rule.id);
  }
}
</script>

<style scoped>
.meal-rule-create {
  padding-block: 24px;
}
.meal-rule-heading {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}
.meal-rule-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  white-space: normal;
}
.meal-rule-title > span:first-child {
  flex: 1 1 240px;
}
</style>
