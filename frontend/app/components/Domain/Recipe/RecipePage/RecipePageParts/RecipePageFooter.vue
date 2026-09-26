<template>
  <div>
    <v-card-actions class="justify-end mx-n2 px-0">
      <v-text-field v-if="isEditForm" v-model="recipe.orgURL" class="mt-10 w-100" variant="outlined"
        :label="$t('recipe.original-url')" :prepend-inner-icon="$globals.icons.link" />
    </v-card-actions>
    <AdvancedOnly>
      <v-card v-if="isEditForm" class="mb-2 mx-n2 rounded-lg">
        <v-card-title class="text-h5 font-weight-medium opacity-80">
          {{ $t('recipe.api-extras') }}
        </v-card-title>
        <v-divider class="ml-4" />
        <v-card-text>
          {{ $t('recipe.api-extras-description') }}
          <v-row v-for="(_, key) in recipe.extras" :key="key" class="mt-1">
            <v-col style="max-width: 400px;">
              <v-text-field v-model="recipe.extras[key]" density="compact" variant="outlined" :label="key">
                <template #prepend>
                  <v-btn color="error" icon class="mt-n4" @click="removeApiExtra(key)">
                    <v-icon> {{ $globals.icons.delete }} </v-icon>
                  </v-btn>
                </template>
              </v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="d-flex flex-column align-center ga-2 py-4 ml-2">
          <div class="w-100">
            <v-text-field v-model="apiNewKey" class="w-100" :label="$t('recipe.message-key')" variant="outlined" />
          </div>
          <BaseButton create size="default" @click="createApiExtra" />
        </v-card-actions>
      </v-card>
    </AdvancedOnly>
  </div>
</template>

<script setup lang="ts">
import { usePageState } from "~/composables/recipe-page/shared-state";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import type { Recipe } from "~/lib/api/types/recipe";

const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });
const { isEditForm } = usePageState(recipe.value.slug);
const apiNewKey = ref("");

function createApiExtra() {
  if (!recipe.value) {
    return;
  }
  if (!recipe.value.extras) {
    recipe.value.extras = {};
  }
  // check for duplicate keys
  if (Object.keys(recipe.value.extras).includes(apiNewKey.value)) {
    return;
  }
  recipe.value.extras[apiNewKey.value] = "";
  apiNewKey.value = "";
}

function removeApiExtra(key: string | number) {
  if (!recipe.value) {
    return;
  }
  if (!recipe.value.extras) {
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete recipe.value.extras[key];
  recipe.value.extras = { ...recipe.value.extras };
}
</script>
