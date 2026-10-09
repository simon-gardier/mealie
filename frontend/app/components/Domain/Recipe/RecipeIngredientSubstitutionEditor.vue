<template>
  <div>
    <div v-for="substitution, i in substitutions" :key="i" class="mb-2">
      <!-- wraps rather than stacking: on a narrow screen the food takes its own line and the
           note keeps the delete button company, instead of stranding it on a line of its own -->
      <div class="d-flex ga-2 align-center flex-wrap">
        <v-autocomplete
          v-model="substitution.substituteFoodId"
          :search="foodSearch.get(substitution) || ''"
          :items="foods"
          :custom-filter="normalizeFilter"
          item-value="id"
          item-title="name"
          :label="$t('recipe.choose-substitute-food')"
          :style="$vuetify.display.mdAndDown ? 'flex: 1 1 100%;' : 'flex: 6 0 50px;'"
          :menu-props="{ attach: menuAttachTarget, maxHeight: '250px', contentClass: 'recipe-editor-overlay' }"
          density="compact"
          :variant="variant"
          clearable
          hide-details
          @update:search="foodSearch.set(substitution, $event)"
          @update:model-value="emit('food-changed', i)"
        >
          <template #append-item>
            <div v-if="canCreateFood(substitution)" class="ingredient-create-option">
              <v-btn
                variant="tonal"
                color="primary"
                class="ingredient-create-button"
                :prepend-icon="$globals.icons.create"
                @click="createAssignFood(substitution, i)"
              >
                {{ $t('recipe.parser.add-item', { name: foodSearch.get(substitution)?.trim() }) }}
              </v-btn>
            </div>
          </template>
        </v-autocomplete>
        <v-text-field
          v-model="substitution.note"
          :label="$t('recipe.note')"
          :style="$vuetify.display.mdAndDown ? 'flex: 1 1 0;' : 'flex: 4 0 50px;'"
          density="compact"
          :variant="variant"
          hide-details
        />
        <!-- left at the default size: an icon button is a 36px touch target everywhere else in
             the app, and the smaller sizes fall under the 24px accessible minimum -->
        <v-btn
          icon
          variant="plain"
          color="error"
          class="flex-shrink-0"
          :title="$t('general.delete')"
          :aria-label="$t('general.delete')"
          @click="emit('delete', i)"
        >
          <v-icon>{{ $globals.icons.delete }}</v-icon>
        </v-btn>
      </div>
      <slot name="after-row" :substitution="substitution" :index="i" />
    </div>
    <v-btn
      variant="tonal"
      color="primary"
      @click="emit('add')"
    >
      <v-icon start>
        {{ $globals.icons.create }}
      </v-icon>
      {{ $t("general.add") }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { normalize, normalizeFilter } from "~/composables/use-utils";
import { useFoodData, useFoodStore } from "~/composables/store";
import type { IngredientFood } from "~/lib/api/types/recipe";

/**
 * The shape both tiers share. Callers hold richer rows of their own -- the food dialog tracks a
 * reverse-substitution choice alongside each one -- so rows are mutated in place here and added
 * or removed by the caller, which is the only side that knows what a new row should contain.
 */
export interface EditableSubstitution {
  substituteFoodId?: string | null;
  note?: string | null;
}

interface Props {
  substitutions: EditableSubstitution[];
  foods: IngredientFood[];
  // left unset inside a dialog, so the menu stays in Vuetify's overlay stack rather than being
  // teleported to the body and risking a render behind the dialog
  menuAttachTarget?: string;
  variant?: "filled" | "outlined";
}

const props = withDefaults(defineProps<Props>(), {
  menuAttachTarget: undefined,
  variant: "filled",
});

const foodSearch = reactive(new WeakMap<EditableSubstitution, string>());
const foodStore = useFoodStore();
const foodData = useFoodData();

function canCreateFood(substitution: EditableSubstitution) {
  const name = foodSearch.get(substitution)?.trim();
  return !!name && !props.foods.some(food => normalize(food.name) === normalize(name));
}

async function createAssignFood(substitution: EditableSubstitution, index: number) {
  const name = foodSearch.get(substitution)?.trim();
  if (!name || !canCreateFood(substitution)) {
    return;
  }

  foodData.data.name = name;
  const food = await foodStore.actions.createOne(foodData.data);
  foodData.reset();
  if (food) {
    substitution.substituteFoodId = food.id;
    // Vuetify does not synchronize the selected title while the input is focused.
    foodSearch.set(substitution, food.name);
    emit("food-changed", index);
  }
}

const emit = defineEmits<{
  "add": [];
  "delete": [index: number];
  "food-changed": [index: number];
}>();
</script>

<style scoped>
.ingredient-create-option {
  padding: 8px 12px;
}
.ingredient-create-button {
  min-height: 44px;
  max-width: 100%;
  height: auto;
  padding-block: 10px;
  font-size: 0.875rem;
  text-transform: none;
  letter-spacing: normal;
}
.ingredient-create-button :deep(.v-btn__content) {
  white-space: normal;
  overflow-wrap: anywhere;
  text-align: left;
}
</style>
