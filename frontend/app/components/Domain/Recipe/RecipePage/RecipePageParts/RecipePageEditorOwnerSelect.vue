<template>
  <v-select v-model="recipe.userId" max-width="300" :items="allUsers" :item-props="itemsProps"
    :label="$t('general.owner')" :disabled="!canEditOwner" variant="outlined" density="compact" hide-details>
    <template #prepend>
      <UserAvatar :user-id="recipe.userId" :tooltip="false" />
    </template>
  </v-select>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePageUser } from "~/composables/recipe-page/shared-state";
import { useHouseholdStore, useUserStore } from "~/composables/store";
import UserAvatar from "~/components/Domain/User/UserAvatar.vue";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import type { Recipe } from "~/lib/api/types/recipe";

const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });

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
