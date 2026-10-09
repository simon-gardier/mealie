<!-- eslint-disable vue/no-v-html -->
<template>
  <div :class="dense ? 'wrapper' : 'wrapper pa-3'">
    <header class="print-header" :class="{ 'print-header-with-image': showImage, 'print-image-right': preferences.imagePosition === ImagePosition.right }">
      <img v-if="showImage" :key="imageKey" :src="recipeImageUrl" :alt="recipe.name" class="print-image">
      <div class="print-overview">
        <h1>{{ recipe.name }}</h1>
        <p v-if="recipeYield" class="print-yield" v-html="recipeYield" />
        <dl v-if="printTimes.length" class="print-times">
          <div v-for="time in printTimes" :key="time.label">
            <dt>{{ time.label }}</dt>
            <dd>{{ time.value }}</dd>
          </div>
        </dl>
        <SafeMarkdown v-if="preferences.showDescription && recipe.description" :source="recipe.description" class="print-description" />
      </div>
    </header>

    <!-- Ingredients -->
    <section>
      <h2>
        {{ i18n.t("recipe.ingredients") }}
      </h2>
      <div
        v-for="(ingredientSection, sectionIndex) in ingredientSections"
        :key="`ingredient-section-${sectionIndex}`"
        class="print-section"
      >
        <h4
          v-if="ingredientSection.sectionName"
          class="ingredient-title mt-2"
        >
          {{ ingredientSection.sectionName }}
        </h4>
        <div
          class="ingredient-grid"
        >
          <div
            v-for="(ingredient, ingredientIndex) in ingredientSection.ingredients"
            :key="`ingredient-${ingredientIndex}`"
            class="ingredient-cell"
          >
            <!-- eslint-disable-next-line vue/no-v-html -->
            <p
              class="ingredient-body"
              v-html="parseText(ingredient)"
            />
            <!-- paper has nothing to tap, so what the menu holds on screen is spelled out here -->
            <SafeMarkdown
              v-if="preferences.showSubstitutions && substitutionSummary(ingredient)"
              class="substitution-body"
              :source="i18n.t('recipe.substitutions-with-value', { substitutions: substitutionSummary(ingredient) })"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Instructions -->
    <section>
      <div
        v-for="(instructionSection, sectionIndex) in instructionSections"
        :key="`instruction-section-${sectionIndex}`"
        class="instruction-section"
      >
        <h2 v-if="!sectionIndex">
          {{ i18n.t("recipe.instructions") }}
        </h2>
        <div
          v-for="(step, stepIndex) in instructionSection.instructions"
          :key="`instruction-${stepIndex}`"
        >
          <div class="print-section">
            <h4
              v-if="step.title"
              :key="`instruction-title-${stepIndex}`"
              class="instruction-title mb-2"
            >
              {{ step.title }}
            </h4>
            <h5>
              {{ step.summary ? step.summary : i18n.t("recipe.step-index", {
                step: stepIndex
                  + instructionSection.stepOffset
                  + 1,
              }) }}
            </h5>
            <SafeMarkdown
              :source="step.text"
              class="recipe-step-body"
            />
            <!-- Step Ingredients -->
            <div
              v-if="preferences.showLinkedIngredients && step.ingredientReferences && step.ingredientReferences.length > 0"
              class="print-section"
            >
              <h6
                class="ingredient-title mt-2 mb-0"
              >
                {{ i18n.t("recipe.ingredients") }}
              </h6>
              <div
                class="step-ingredient-grid"
              >
                <template
                  v-for="(ingredient, ingredientIndex) in stepLinkedIngredients.get(`${sectionIndex}-${stepIndex}`) ?? []"
                  :key="`ingredient-${ingredientIndex}`"
                >
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <p
                    class="ingredient-body"
                    v-html="parseText(ingredient)"
                  />
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Notes -->
    <div v-if="preferences.showNotes && hasNotes">
      <h2>{{ i18n.t("recipe.notes") }}</h2>

      <section>
        <div
          v-for="(note, index) in recipe.notes"
          :key="index + 'note'"
        >
          <div class="print-section">
            <h4>{{ note.title }}</h4>
            <SafeMarkdown
              :source="note.text"
              class="note-body"
            />
          </div>
        </div>
      </section>
    </div>

    <!-- Nutrition -->
    <div v-if="preferences.showNutrition && hasNutrition">
      <h2>
        {{ i18n.t("recipe.nutrition") }}
      </h2>

      <section>
        <div class="print-section">
          <table class="nutrition-table">
            <tbody>
              <tr
                v-for="(value, key) in populatedNutrition"
                :key="key"
              >
                <template v-if="value">
                  <td>{{ labels[key]?.label }}</td>
                  <td>{{ value ? (labels[key]?.suffix ? `${value} ${labels[key]?.suffix}` : value) : '-' }}</td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RecipeView } from "~/lib/recipe/recipe-view";
import DOMPurify from "dompurify";
import { useStaticRoutes } from "~/composables/api";
import type { RecipeIngredient, RecipeStep } from "~/lib/api/types/recipe";
import { ImagePosition, useUserPrintPreferences } from "~/composables/use-users/preferences";
import { ingredientSubstitutionSummary, useFoodPlurality, useIngredientTextParser, useNutritionLabels } from "~/composables/recipes";
import { usePageState } from "~/composables/recipe-page/shared-state";
import { useScaledAmount } from "~/composables/recipes/use-scaled-amount";

type IngredientSection = {
  sectionName: string;
  ingredients: RecipeIngredient[];
};

type InstructionSection = {
  sectionName: string;
  stepOffset: number;
  instructions: RecipeStep[];
};

interface Props {
  recipe: RecipeView;
  scale?: number;
  dense?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  scale: 1,
  dense: false,
});

const i18n = useI18n();
const preferences = useUserPrintPreferences();
const { recipeImage } = useStaticRoutes();
const { imageKey } = usePageState(props.recipe.slug);
const { labels } = useNutritionLabels();

function sanitizeHTML(rawHtml: string) {
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ["strong", "sup"],
  });
}
const servingsDisplay = computed(() => {
  const { scaledAmountDisplay } = useScaledAmount(props.recipe.recipeYieldQuantity, props.scale);
  return scaledAmountDisplay || props.recipe.recipeYield
    ? i18n.t("recipe.yields-amount-with-text", {
      amount: scaledAmountDisplay,
      text: props.recipe.recipeYield,
    }) as string
    : "";
});

const yieldDisplay = computed(() => {
  const { scaledAmountDisplay } = useScaledAmount(props.recipe.recipeServings, props.scale);
  return scaledAmountDisplay ? i18n.t("recipe.serves-amount", { amount: scaledAmountDisplay }) as string : "";
});

const recipeYield = computed(() => {
  if (servingsDisplay.value && yieldDisplay.value) {
    return sanitizeHTML(`${yieldDisplay.value}; ${servingsDisplay.value}`);
  }
  else {
    return sanitizeHTML(yieldDisplay.value || servingsDisplay.value);
  }
});

const recipeImageUrl = computed(() => {
  return recipeImage(props.recipe.id, props.recipe.image, imageKey.value);
});

// Group ingredients by section so we can style them independently
const ingredientSections = computed<IngredientSection[]>(() => {
  if (!props.recipe.recipeIngredient) {
    return [];
  }
  const addIngredientsToSections = (ingredients: RecipeIngredient[], sections: IngredientSection[], title: string | null) => {
  // If title is set, ensure the section exists before adding ingredients
    let section: IngredientSection | undefined;
    if (title) {
      section = sections.find(sec => sec.sectionName === title);
      if (!section) {
        section = { sectionName: title, ingredients: [] };
        sections.push(section);
      }
    }

    ingredients.forEach((ingredient) => {
      if (preferences.value.expandChildRecipes && ingredient.referencedRecipe?.recipeIngredient?.length) {
        // Recursively add to the section for this referenced recipe
        addIngredientsToSections(
          ingredient.referencedRecipe.recipeIngredient,
          sections,
          "",
        );
      }
      else {
        const sectionName = title || ingredient.title || "";
        if (sectionName) {
          let sec = sections.find(sec => sec.sectionName === sectionName);
          if (!sec) {
            sec = { sectionName, ingredients: [] };
            sections.push(sec);
          }
          sec.ingredients.push(ingredient);
        }
        else {
          if (sections.length === 0) {
            sections.push({
              sectionName: "",
              ingredients: [ingredient],
            });
          }
          else {
            sections.at(-1)?.ingredients.push(ingredient);
          }
        }
      }
    });
  };

  const sections: IngredientSection[] = [];
  addIngredientsToSections(props.recipe.recipeIngredient, sections, null);
  return sections;
});

// Group instructions by section so we can style them independently
const instructionSections = computed<InstructionSection[]>(() => {
  if (!props.recipe.recipeInstructions) {
    return [];
  }

  return props.recipe.recipeInstructions.reduce((sections, step) => {
    const offset = (() => {
      if (sections.length === 0) {
        return 0;
      }

      const lastOffset = sections.at(-1)?.stepOffset ?? 0;
      const lastNumSteps = sections.at(-1)?.instructions.length ?? 0;
      return lastOffset + lastNumSteps;
    })();

    // if title append new section to the end of the array
    if (step.title) {
      sections.push({
        sectionName: step.title,
        stepOffset: offset,
        instructions: [step],
      });

      return sections;
    }

    // append if first element
    if (sections.length === 0) {
      sections.push({
        sectionName: "",
        stepOffset: offset,
        instructions: [step],
      });

      return sections;
    }

    // otherwise add step to last section in the array
    sections.at(-1)?.instructions.push(step);
    return sections;
  }, [] as InstructionSection[]);
});

const showImage = computed(() => !!props.recipe.image && !!preferences.value.imagePosition && preferences.value.imagePosition !== ImagePosition.hidden);
const printTimes = computed(() => [
  { label: i18n.t("recipe.total-time"), value: props.recipe.totalTime },
  { label: i18n.t("recipe.prep-time"), value: props.recipe.prepTime },
  { label: i18n.t("recipe.perform-time"), value: props.recipe.performTime },
].filter(time => time.value));
const populatedNutrition = computed(() => Object.fromEntries(Object.entries(props.recipe.nutrition || {}).filter(([, value]) => !!value)) as Partial<typeof props.recipe.nutrition>);
const hasNutrition = computed(() => Object.keys(populatedNutrition.value).length > 0);

const hasNotes = computed(() => {
  return props.recipe.notes && props.recipe.notes.length > 0;
});

// Precompute each step's linked ingredients so the template doesn't re-filter recipeIngredient on every render
const stepLinkedIngredients = computed(() => {
  const map = new Map<string, RecipeIngredient[]>();

  instructionSections.value.forEach((section, sectionIndex) => {
    section.instructions.forEach((step, stepIndex) => {
      if (!step.ingredientReferences?.length) {
        return;
      }

      const referenceIds = new Set(step.ingredientReferences.map(ref => ref.referenceId));
      map.set(
        `${sectionIndex}-${stepIndex}`,
        props.recipe.recipeIngredient.filter(ing => ing.referenceId && referenceIds.has(ing.referenceId)),
      );
    });
  });

  return map;
});

const { parseIngredientText } = useIngredientTextParser();

function parseText(ingredient: RecipeIngredient) {
  if (!ingredient.food && !ingredient.referencedRecipe && (ingredient.originalText || ingredient.note)) {
    return DOMPurify.sanitize(ingredient.originalText || ingredient.note || "");
  }
  return parseIngredientText(ingredient, props.scale);
}

const { shouldPluralizeFood } = useFoodPlurality();

// the substitutes inflect with the line they stand in for, the same as on screen
function substitutionSummary(ingredient: RecipeIngredient) {
  return ingredientSubstitutionSummary(ingredient, shouldPluralizeFood(ingredient, props.scale));
}
</script>

<style scoped>
.wrapper {
  background: rgb(var(--v-theme-print-background));
  color: rgb(var(--v-theme-print-foreground));
  font-family: "Inter", Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.45;
  padding: 0;
}
.wrapper :deep(*) {
  color: inherit;
  opacity: 1;
}
.print-header {
  display: grid;
  gap: 6mm;
  margin-bottom: 4mm;
}
.print-header-with-image {
  grid-template-columns: 42mm minmax(0, 1fr);
}
.print-image {
  width: 42mm;
  height: 42mm;
  object-fit: cover;
  border-radius: 3mm;
}
.print-image-right {
  grid-template-columns: minmax(0, 1fr) 42mm;
}
.print-image-right .print-image {
  order: 1;
}
.print-overview {
  min-width: 0;
}
h1 {
  font-size: 18pt;
  font-weight: 600;
  line-height: 1.2;
  margin: 0 0 3mm;
  overflow-wrap: anywhere;
}
h2 {
  font-size: 13pt;
  font-weight: 600;
  margin: 4mm 0 2mm;
  break-after: avoid;
}
h4 {
  font-size: 11pt;
  font-weight: 600;
  margin: 3mm 0 2mm;
  break-after: avoid;
}
h5 {
  font-size: 11pt;
  font-weight: 600;
  margin: 0 0 2mm;
  break-after: avoid;
}
h6 {
  font-size: 10pt;
  font-weight: 600;
  margin: 2mm 0 1mm;
  break-after: avoid;
}
.print-yield {
  margin: 0 0 3mm;
}
.print-times {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 3mm;
  margin: 0 0 3mm;
  font-size: 9pt;
}
.print-times dt {
  font-weight: 600;
}
.print-times dd {
  margin: 0;
}
.print-description {
  font-size: 10pt;
}
.print-section {
  break-inside: avoid;
  margin-bottom: 2mm;
}
.ingredient-grid,
.step-ingredient-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2mm 6mm;
}
.ingredient-cell {
  break-inside: avoid;
}
.ingredient-body {
  margin: 0;
  font-size: 10pt;
  overflow-wrap: anywhere;
}
.recipe-step-body,
.note-body {
  font-size: 10.5pt;
}
.wrapper :deep(p) {
  margin: 0 0 2mm;
}
.wrapper :deep(p:last-child) {
  margin-bottom: 0;
}
.wrapper :deep(ul),
.wrapper :deep(ol) {
  padding-left: 5mm;
  margin: 2mm 0;
}
.wrapper :deep(li) {
  margin-bottom: 1mm;
}
.wrapper :deep(img) {
  max-width: 100%;
}
.substitution-body {
  font-size: 9pt;
  line-height: 1.4;
  margin-top: 1mm;
}
.nutrition-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10pt;
}
.nutrition-table tr {
  break-inside: avoid;
}
.nutrition-table td {
  padding: 1mm 0;
  border-bottom: 1px solid rgb(var(--v-theme-separator));
}
.nutrition-table td:first-child {
  font-weight: 500;
}
.nutrition-table td:last-child {
  text-align: right;
}
@media print {
  .wrapper {
    padding: 0 !important;
  }
  .print-header {
    break-inside: avoid;
  }
  .wrapper :deep(*) {
    font-family: "Inter", Arial, sans-serif !important;
  }
}
</style>
