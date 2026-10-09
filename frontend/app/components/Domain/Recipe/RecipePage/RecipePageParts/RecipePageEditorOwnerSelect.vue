<template>
  <v-select
    v-model="recipe.userId"
    :items="allUsers"
    :menu-props="{ contentClass: 'recipe-editor-overlay' }"
    :item-props="itemsProps"
    :label="$t('general.owner')"
    :disabled="!canEditOwner"
    variant="filled"
    density="compact"
    hide-details
  />
</template>

<script setup lang="ts">
import type { RecipeView } from "~/lib/recipe/recipe-view";
import { computed } from "vue";
import { usePageUser } from "~/composables/recipe-page/shared-state";
import { useHouseholdStore, useUserStore } from "~/composables/store";

const recipe = defineModel<RecipeView>({ required: true });

const { user } = usePageUser();
const { store: allUsers } = useUserStore();
const { store: households } = useHouseholdStore();

const canEditOwner = computed(() => {
  return user.id === recipe.value.userId || user.admin;
});

function itemsProps(item: any) {
  const owner = allUsers.value.find(user => user.id === item.id);
  return {
    value: item.id,
    title: item.fullName,
    subtitle: owner ? households.value.find(household => household.id === owner.householdId)?.name || "" : "",
  };
}
</script>
