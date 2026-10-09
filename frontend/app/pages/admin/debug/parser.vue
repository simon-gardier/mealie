<template>
  <v-container class="pa-0">
    <v-container>
      <BaseCardSectionTitle :title="$t('admin.ingredients-natural-language-processor')">
        {{ $t('admin.ingredients-natural-language-processor-explanation') }}

        <p class="pt-3">
          {{ $t('admin.ingredients-natural-language-processor-explanation-2') }}
        </p>
      </BaseCardSectionTitle>

      <div class="parser-controls">
        <v-btn-toggle
          v-model="state.parser"
          density="compact"
          mandatory="force"
        >
          <v-btn value="nlp">
            {{ $t('admin.nlp') }}
          </v-btn>
          <v-btn value="brute">
            {{ $t('admin.brute') }}
          </v-btn>
          <v-btn value="openai">
            {{ $t('admin.openai') }}
          </v-btn>
        </v-btn-toggle>
        <v-spacer />
        <v-checkbox
          v-model="showConfidence"
          class="parser-confidence-toggle"
          :label="$t('admin.show-individual-confidence')"
          hide-details
        />
      </div>

      <v-card flat class="parser-input-card">
        <v-card-text>
          <v-text-field
            v-model="state.ingredient"
            :label="$t('admin.ingredient-text')"
          />
        </v-card-text>
        <v-card-actions>
          <BaseButton
            class="ml-auto"
            :loading="state.loading"
            :disabled="!state.ingredient.trim()"
            @click="processIngredient"
          >
            <template #icon>
              {{ $globals.icons.check }}
            </template>
            {{ $t("general.submit") }}
          </BaseButton>
        </v-card-actions>
      </v-card>
    </v-container>
    <v-container v-if="state.results">
      <div
        v-if="state.parser !== 'brute' && getConfidence('average')"
        class="parser-overall-confidence"
      >
        <v-chip
          dark
          :color="getColor('average')"
          class="mx-auto mb-2"
        >
          {{ $t('admin.average-confident', [getConfidence("average")]) }}
        </v-chip>
      </div>
      <div
        class="parser-result-grid"
      >
        <template v-for="(prop, index) in properties">
          <div
            v-if="prop.value"
            :key="index"
            class="flex-grow-1"
          >
            <v-card class="parser-result-card">
              <v-card-text>
                <div class="parser-result-header">
                  <h3>{{ prop.subtitle }}</h3>
                  <v-chip v-if="prop.confidence && showConfidence" variant="tonal" :color="prop.color!" size="small">
                    {{ $t('admin.average-confident', [prop.confidence]) }}
                  </v-chip>
                </div>
                <p class="parser-result-value">
                  {{ prop.value }}
                </p>
              </v-card-text>
            </v-card>
          </div>
        </template>
      </div>
    </v-container>
    <v-container class="narrow-container">
      <v-card-title> {{ $t('admin.try-an-example') }} </v-card-title>
      <v-card
        v-for="(text, idx) in tryText"
        :key="idx"
        class="my-2"
        hover
        @click="processTryText(text)"
      >
        <v-card-text> {{ text }} </v-card-text>
      </v-card>
    </v-container>
  </v-container>
</template>

<script setup lang="ts">
import { ingredientAnalysisErrorKey } from "~/lib/ingredient-analysis-error";
import { alert } from "~/composables/use-toast";
import { useUserApi } from "~/composables/api";
import type { IngredientConfidence } from "~/lib/api/types/recipe";
import type { Parser } from "~/lib/api/user/recipes/recipe";

type ConfidenceAttribute = "average" | "comment" | "name" | "unit" | "quantity" | "food";

definePageMeta({
  layout: "admin",
});

const api = useUserApi();

const state = reactive({
  loading: false,
  ingredient: "",
  results: false,
  parser: "nlp" as Parser,
});

const i18n = useI18n();

// Set page title
useSeoMeta({
  title: i18n.t("admin.parser"),
});

const confidence = ref<IngredientConfidence>({});

function getColor(attribute: ConfidenceAttribute) {
  const percentage = getConfidence(attribute);
  if (percentage === undefined) return;

  const p_as_num = parseFloat(percentage.replace("%", ""));

  // Set color based off range
  if (p_as_num > 75) {
    return "success";
  }
  else if (p_as_num > 60) {
    return "warning";
  }
  else {
    return "error";
  }
}

function getConfidence(attribute: ConfidenceAttribute) {
  if (!confidence.value) {
    return;
  }

  const property = confidence.value[attribute];
  if (property !== undefined && property !== null) {
    return `${(+property * 100).toFixed(0)}%`;
  }
  return undefined;
}

const tryText = [
  "2 tbsp minced cilantro, leaves and stems",
  "1 large yellow onion, coarsely chopped",
  "1 1/2 tsp garam masala",
  "1 inch piece fresh ginger, (peeled and minced)",
  "2 cups mango chunks, (2 large mangoes) (fresh or frozen)",
];

function processTryText(str: string) {
  state.ingredient = str;
  processIngredient();
}

async function processIngredient() {
  if (state.ingredient === "") {
    return;
  }

  const requestId = ++analysisRequestId;
  const parser = state.parser;
  const input = state.ingredient;
  clearResults();
  state.loading = true;
  try {
    const { data, error } = await api.recipes.parseIngredient(parser, input);
    if (requestId !== analysisRequestId) return;

    if (data) {
      state.results = true;

      confidence.value = data.confidence || {};

      // TODO: Remove ts-ignore
      // ts-ignore because data will likely change significantly once I figure out how to return results
      // for the parser. For now we'll leave it like this
      properties.comment.value = data.ingredient.note || "";
      properties.quantity.value = data.ingredient.quantity || "";
      properties.unit.value = data.ingredient?.unit?.name || "";
      properties.food.value = data.ingredient?.food?.name || "";

      (["comment", "quantity", "unit", "food"] as ConfidenceAttribute[]).forEach((property) => {
        const color = getColor(property);
        const confidence = getConfidence(property);
        if (color) {
          properties[property].color = color;
        }
        if (confidence) {
          properties[property].confidence = confidence;
        }
      });
    }
    else {
      alert.error(i18n.t(ingredientAnalysisErrorKey(parser, error)));
      state.results = false;
    }
  }
  catch (error) {
    if (requestId === analysisRequestId) {
      clearResults();
      alert.error(i18n.t(ingredientAnalysisErrorKey(parser, error)));
    }
  }
  finally {
    if (requestId === analysisRequestId) state.loading = false;
  }
}

const properties = reactive({
  quantity: {
    subtitle: i18n.t("recipe.quantity"),
    value: "" as string | number,
    color: null as string | null,
    confidence: null as string | null,
  },
  unit: {
    subtitle: i18n.t("recipe.unit"),
    value: "",
    color: null as string | null,
    confidence: null as string | null,
  },
  food: {
    subtitle: i18n.t("shopping-list.food"),
    value: "",
    color: null as string | null,
    confidence: null as string | null,
  },
  comment: {
    subtitle: i18n.t("recipe.comment"),
    value: "",
    color: null as string | null,
    confidence: null as string | null,
  },
});

let analysisRequestId = 0;
function clearResults() {
  state.results = false;
  confidence.value = {};
  Object.values(properties).forEach((property) => {
    property.color = null;
    property.confidence = null;
  });
}
watch([() => state.parser, () => state.ingredient], () => {
  analysisRequestId++;
  clearResults();
  state.loading = false;
}, { flush: "sync" });
const showConfidence = ref(false);
</script>

<style scoped></style>

<style scoped>
.parser-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding-block: 24px 16px;
}
.parser-controls :deep(.v-btn-toggle) {
  gap: 8px;
  height: auto;
  padding: 4px;
  overflow: visible;
}
.parser-controls :deep(.v-btn) {
  min-height: 44px;
  border-radius: 10px !important;
}
.parser-confidence-toggle {
  margin: 0;
}
.parser-input-card,
.parser-result-card {
  border-radius: 14px;
}
.parser-overall-confidence {
  display: flex;
  margin-bottom: 16px;
}
.parser-result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.parser-result-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}
.parser-result-header h3 {
  font: 600 14px var(--bistro-body);
  color: rgba(var(--v-theme-text-secondary), var(--v-secondary-label-opacity));
}
.parser-result-value {
  margin: 0;
  font: 500 16px/1.5 var(--bistro-body);
  overflow-wrap: anywhere;
}
@media (max-width: 599px) {
  .parser-result-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
