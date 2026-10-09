<template>
  <section @keyup.ctrl.z="undoMerge">
    <BaseDialog
      v-model="dialog"
      :title="$t('recipe.link-references')"
      width="760"
      max-width="760"
      color="surface"
      cancel-in-toolbar
      disable-submit-on-enter
    >
      <div class="reference-body">
        <div class="reference-step">
          <span class="reference-eyebrow">{{ $t('recipe.reference-linker.step', { current: activeLinkerIndex + 1, total: instructionList.length }) }}</span>
          <p class="reference-step-text">
            {{ activeDialogStepText }}
          </p>
        </div>
        <p class="reference-help">
          {{ $t('recipe.reference-linker.description') }}
        </p>

        <section class="reference-section">
          <div class="reference-section-heading">
            <h3>{{ $t('recipe.ingredients') }}</h3>
            <span class="reference-count">{{ $t('recipe.reference-linker.selected', { count: activeRefs.length }) }}</span>
          </div>
          <v-btn variant="tonal" color="primary" class="reference-detect" @click="autoSetReferences">
            {{ $t('recipe.reference-linker.detect') }}
          </v-btn>
          <p v-if="!Object.keys(groupedUnusedIngredients).length && !Object.keys(groupedUsedIngredients).length" class="reference-help">
            {{ $t('recipe.reference-linker.no-ingredients') }}
          </p>
          <template v-for="(groups, groupIndex) in [groupedUnusedIngredients, groupedUsedIngredients]" :key="groupIndex">
            <div v-if="Object.keys(groups).length" class="reference-group">
              <p v-if="groupIndex === 1" class="reference-help reference-reused">
                {{ $t('recipe.reference-linker.reused') }}
              </p>
              <template v-for="(ingredients, title) in groups" :key="title">
                <h4 v-if="title" class="reference-group-title">
                  {{ title }}
                </h4>
                <v-checkbox-btn
                  v-for="ing in ingredients"
                  :key="ing.referenceId"
                  v-model="activeRefs"
                  :value="ing.referenceId"
                  color="primary"
                  :class="['reference-option', { 'reference-option-selected': activeRefs.includes(ing.referenceId || '') }]"
                >
                  <template #label>
                    <RecipeIngredientHtml :ingredient="ing" :scale="scale" />
                  </template>
                </v-checkbox-btn>
              </template>
            </div>
          </template>
        </section>

        <section class="reference-section">
          <div class="reference-section-heading">
            <h3>{{ $t('recipe.notes') }}</h3>
            <span v-if="linkableNotes.length" class="reference-count">{{ $t('recipe.reference-linker.selected', { count: activeNoteReferenceIds.length }) }}</span>
          </div>
          <p class="reference-help">
            {{ $t(linkableNotes.length ? 'recipe.reference-linker.notes-description' : 'recipe.reference-linker.no-notes') }}
          </p>
          <v-checkbox-btn
            v-for="note in linkableNotes"
            :key="note.referenceId"
            v-model="activeNoteReferenceIds"
            :value="note.referenceId"
            color="primary"
            :class="['reference-option', { 'reference-option-selected': activeNoteReferenceIds.includes(note.referenceId) }]"
          >
            <template #label>
              {{ note.title || $t('recipe.note') }}
            </template>
          </v-checkbox-btn>
        </section>
      </div>
      <template #card-actions>
        <div class="reference-footer">
          <BaseButton cancel @click="closeDialog" />
          <div class="reference-footer-actions">
            <v-btn v-if="availableDialogNextStep" variant="tonal" color="primary" @click="saveAndOpenNextDialogLinks">
              {{ $t('recipe.reference-linker.apply-next') }}
            </v-btn>
            <v-btn variant="flat" color="primary" @click="saveDialogLinks">
              {{ $t('recipe.reference-linker.apply') }}
            </v-btn>
          </div>
        </div>
      </template>
    </BaseDialog>

    <div class="d-flex justify-space-between justify-start" :class="{ 'mb-6': !isCookMode }">
      <h2 v-if="!isCookMode" class="recipe-section-title mt-1 text-h5 font-weight-medium opacity-80">
        {{ $t("recipe.instructions") }}
      </h2>
    </div>
    <v-bottom-sheet v-model="linkedNotesSheetOpen" max-width="900" inset>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon size="20" class="mr-2">
            {{ $globals.icons.noteTextOutline }}
          </v-icon>
          {{ $t('recipe.linked-notes-with-count', { count: activeStepLinkedNotes.length }) }}
          <v-spacer />
          <v-btn
            icon
            variant="text"
            density="comfortable"
            :aria-label="$t('general.close')"
            @click="linkedNotesSheetOpen = false"
          >
            <v-icon>{{ $globals.icons.close }}</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <template v-for="(note, noteIndex) in activeStepLinkedNotes" :key="note.referenceId ?? note.title">
            <v-divider v-if="noteIndex > 0" class="recipe-instruction-card my-3" />
            <div class="text-title-large mb-1">
              {{ note.title || $t('recipe.note') }}
            </div>
            <SafeMarkdown :source="note.text" />
          </template>
        </v-card-text>
      </v-card>
    </v-bottom-sheet>
    <VueDraggable
      v-model="instructionList"
      class="recipe-instructions-list"
      :disabled="!isEditForm"
      handle=".handle"
      :delay="250"
      :delay-on-touch-only="true"
      v-bind="{
        animation: $vuetify.display.mobile ? 0 : 200,
        group: 'recipe-instructions',
        ghostClass: 'recipe-drop-target',
        chosenClass: 'recipe-drag-chosen',
        dragClass: 'recipe-drag-active',
      }"
      @start="drag = true"
      @end="onDragEnd"
    >
      <TransitionGroup type="transition">
        <div v-for="(step, index) in instructionList" :key="step.id!" :data-step-id="step.id" class="list-group-item">
          <v-sheet
            v-if="step.id && showTitleEditor[step.id]"
            color="transparent"
            class="mt-6 mb-2 d-flex align-center"
            :class="isEditForm ? 'pa-2' : 'pa-3'"
            style="border-radius: 6px; cursor: pointer; width: 100%;"
            @click="toggleCollapseSection(index)"
          >
            <template v-if="isEditForm">
              <v-text-field
                v-model="step.title"
                class="recipe-section-title-input"
                density="comfortable"
                variant="filled"
                :label="$t('recipe.section-title')"
                hide-details
                @click.stop
              >
                <template #append-inner>
                  <v-btn
                    icon
                    variant="text"
                    color="error"
                    size="small"
                    :aria-label="$t('recipe.clear-section')"
                    :title="$t('recipe.clear-section')"
                    @click.stop="toggleShowTitle(step.id)"
                  >
                    <v-icon :icon="$globals.icons.delete" size="20" />
                  </v-btn>
                </template>
              </v-text-field>
            </template>
            <template v-else>
              <v-toolbar-title class="section-title-text">
                {{ step.title }}
              </v-toolbar-title>
            </template>
          </v-sheet>
          <v-hover v-slot="{ isHovering }">
            <v-card
              class="recipe-instruction-card my-3"
              :class="[{ 'on-hover': isHovering }, { 'cursor-default': isEditForm }, { 'recipe-step-editor-card': isEditForm }, { 'recipe-step-complete': isChecked(index) }]"
              :elevation="isEditForm ? 0 : (isHovering ? 12 : 2)"
              :ripple="false"
              @click="toggleDisabled(index)"
            >
              <v-card-title class="recipe-step-title pt-3 pb-0">
                <div v-if="isEditForm" class="step-editor-heading">
                  {{ $t('recipe.step-index', { step: index + 1 }) }}
                </div>
                <div class="d-flex align-center w-100" :class="{ 'recipe-step-editor-toolbar': isEditForm }">
                  <v-text-field
                    v-if="isEditForm"
                    v-model="step.summary"
                    class="recipe-step-title-input"
                    hide-details
                    density="compact"
                    variant="filled"
                    :label="$t('recipe.editor.step-title')"
                    :placeholder="$t('recipe.step-index', { step: index + 1 })"
                  >
                    <template #prepend>
                      <v-icon size="26" class="handle">
                        {{ $globals.icons.arrowUpDown }}
                      </v-icon>
                    </template>
                  </v-text-field>
                  <div v-else class="summary-wrapper">
                    <template v-if="step.summary">
                      <SafeMarkdown class="recipe-step-summary pr-2" :source="step.summary" />
                    </template>
                    <template v-else>
                      <span>
                        {{ $t('recipe.step-index', { step: index + 1 }) }}
                      </span>
                    </template>
                  </div>
                  <v-btn
                    v-if="isCookMode"
                    class="ml-auto"
                    variant="tonal"
                    height="44"
                    :color="isChecked(index) ? 'success' : 'primary'"
                    :aria-pressed="isChecked(index)"
                    @click.stop="toggleDisabled(index)"
                  >
                    <v-icon start>
                      {{ $globals.icons.check }}
                    </v-icon>
                    {{ $t(isChecked(index) ? 'recipe.step-completed' : 'recipe.complete-step') }}
                  </v-btn>
                  <template v-if="isEditForm">
                    <div class="recipe-step-editor-actions ml-auto">
                      <BaseButtonGroup
                        :large="false"
                        rounded
                        :buttons="[
                          {
                            icon: previewStates[step.id!] ? $globals.icons.edit : $globals.icons.eye,
                            text: previewStates[step.id!] ? $t('recipe.edit-markdown') : $t('markdown-editor.preview-markdown-button-label'),
                            event: 'preview-step',
                          },
                          {
                            icon: $globals.icons.upload,
                            text: $t('recipe.upload-image'),
                            event: 'upload-image',
                          },
                          {
                            icon: $globals.icons.delete,
                            text: $t('general.delete'),
                            event: 'delete',
                          },
                          {
                            icon: $globals.icons.dotsVertical,
                            text: '',
                            event: 'open',
                            children: [
                              ...(!showTitleEditor[step.id!] ? [{
                                icon: $globals.icons.textBox,
                                text: $t('recipe.editor.add-section-before'),
                                event: 'toggle-section',
                              }] : []),
                              {
                                icon: $globals.icons.link,
                                text: $t('recipe.link-references'),
                                event: 'link-references',
                              },
                              {
                                icon: $globals.icons.swapHorizontal,
                                text: $t('recipe.merge-above'),
                                event: 'merge-above',
                              },
                              {
                                icon: $globals.icons.arrowUp,
                                text: $t('recipe.move-to-top'),
                                event: 'move-to-top',
                              },
                              {
                                icon: $globals.icons.arrowDown,
                                text: $t('recipe.move-to-bottom'),
                                event: 'move-to-bottom',
                              },
                              {
                                icon: $globals.icons.arrowUp,
                                text: $t('recipe.editor.insert-step-before'),
                                event: 'insert-above',
                              },
                              {
                                icon: $globals.icons.arrowDown,
                                text: $t('recipe.editor.insert-step-after'),
                                event: 'insert-below',
                              },
                            ],
                          },
                        ]"
                        @merge-above="mergeAbove(index - 1, index)"
                        @move-to-top="moveTo('top', index)"
                        @move-to-bottom="moveTo('bottom', index)"
                        @insert-above="insert(index)"
                        @insert-below="insert(index + 1)"
                        @toggle-section="toggleShowTitle(step.id!)"
                        @link-references="openReferenceDialog(index)"
                        @preview-step="togglePreviewState(step.id!)"
                        @upload-image="openImageUpload(index)"
                        @delete="removeStep(step)"
                      />
                    </div>
                  </template>
                  <div v-if="!isEditForm" class="ml-auto d-flex align-center gap-1">
                    <v-btn
                      v-if="hasLinkedNotes(step) && !isCookMode"
                      variant="text"
                      icon
                      density="comfortable"
                      size="small"
                      @click.stop="openLinkedNotesSheet(step)"
                    >
                      <v-icon size="18">
                        {{ $globals.icons.noteTextOutline }}
                      </v-icon>
                      <v-tooltip activator="parent" location="top">
                        {{ $t('recipe.linked-notes-with-count', { count: linkedNotesForStep(step).length }) }}
                      </v-tooltip>
                    </v-btn>
                  </div>
                </div>
              </v-card-title>

              <v-progress-linear v-if="isEditForm && loadingStates[index]" :active="true" :indeterminate="true" />

              <!-- Content -->
              <DropZone
                @drop="(f) => handleImageDrop(index, f)"
                @drop-url="(u) => handleImageUrlDrop(index, u)"
                @drop-unsupported="notifyUnsupportedDrop"
              >
                <v-card-text v-if="isEditForm" @click="$emit('click-instruction-field', `${index}.text`)">
                  <h3 class="step-editor-content-heading">
                    {{ $t('recipe.editor.instruction-text') }}
                  </h3>
                  <MarkdownEditor
                    v-model="step.text"
                    v-model:preview="previewStates[step.id!]"
                    class="mb-2"
                    :display-preview="false"
                    :textarea="{
                      hint: $t('recipe.attach-images-hint'),
                      persistentHint: true,
                    }"
                  />
                  <div
                    v-if="step.ingredientReferences && step.ingredientReferences.length"
                    class="linked-ingredients-editor"
                  >
                    <h3 class="step-editor-content-heading">
                      {{ $t('recipe.editor.linked-ingredients') }}
                    </h3>
                    <div v-for="(linkRef, i) in step.ingredientReferences" :key="linkRef.referenceId ?? i" class="mb-1">
                      <RecipeIngredientHtml
                        v-if="linkRef.referenceId && ingredientLookup[linkRef.referenceId]"
                        :ingredient="ingredientLookup[linkRef.referenceId]"
                        :scale="scale"
                      />
                    </div>
                  </div>
                  <div v-if="step.noteReferences && step.noteReferences.length" class="linked-ingredients-editor">
                    <h3 class="step-editor-content-heading">
                      {{ $t('recipe.editor.linked-notes') }}
                    </h3>
                    <div
                      v-for="(noteRef, i) in step.noteReferences"
                      :key="noteRef.referenceId ?? i"
                      class="mb-1 d-flex align-center text-body-2"
                    >
                      <v-icon size="14" class="mr-1" style="cursor: default;">
                        {{ $globals.icons.noteTextOutline }}
                      </v-icon>
                      {{ noteRef.referenceId != null ? (noteLookup[noteRef.referenceId] || $t('recipe.note')) : '' }}
                    </div>
                  </div>
                </v-card-text>
              </DropZone>
              <div v-if="!isEditForm" class="m-0 p-0">
                <v-card-text class="markdown">
                  <v-row>
                    <v-col v-if="isCookMode && hasCookModeLinkedContent(step)" cols="12" sm="5">
                      <div v-if="hasLinkedIngredients(step)" class="ml-n4">
                        <RecipeIngredients
                          :value="recipe.recipeIngredient.filter((ing) => {
                            if (!step.ingredientReferences) return false
                            return step.ingredientReferences.map((ref) => ref.referenceId).includes(ing.referenceId || '')
                          })"
                          :scale="scale"
                          :is-cook-mode="isCookMode"
                          :storage-key="ingredientStorageKey"
                        />
                      </div>
                      <v-divider v-if="hasLinkedIngredients(step) && hasLinkedNotes(step)" class="recipe-instruction-card my-3" />
                      <div v-if="hasLinkedNotes(step)">
                        <template
                          v-for="(note, noteIndex) in linkedNotesForStep(step)"
                          :key="note.referenceId ?? note.title"
                        >
                          <v-divider v-if="noteIndex > 0" class="recipe-instruction-card my-3" />
                          <div class="text-title-large mb-1">
                            {{ note.title || $t('recipe.note') }}
                          </div>
                          <SafeMarkdown :source="note.text" />
                        </template>
                      </div>
                    </v-col>
                    <v-divider
                      v-if="isCookMode && hasCookModeLinkedContent(step) && $vuetify.display.smAndUp"
                      vertical
                    />
                    <v-col>
                      <SafeMarkdown class="recipe-step-instructions markdown" :source="step.text" />
                    </v-col>
                  </v-row>
                </v-card-text>
              </div>
            </v-card>
          </v-hover>
        </div>
      </TransitionGroup>
    </VueDraggable>
    <slot name="footer" />
    <v-divider v-if="!isCookMode" class="mt-10 d-flex d-md-none" />
  </section>
</template>

<script setup lang="ts">
import type { RecipeView } from "~/lib/recipe/recipe-view";
import { usePencilScratch } from "~/composables/use-pencil-scratch";
import { VueDraggable } from "vue-draggable-plus";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import type { RecipeStep, RecipeNote, RecipeIngredient, RecipeAsset } from "~/lib/api/types/recipe";
import { uuid4 } from "~/composables/use-utils";
import { useUserApi, useStaticRoutes } from "~/composables/api";
import { usePageState } from "~/composables/recipe-page/shared-state";
import { useExtractIngredientReferences } from "~/composables/recipe-page/use-extract-ingredient-references";
import DropZone from "~/components/global/DropZone.vue";
import { alert } from "~/composables/use-toast";
import RecipeIngredients from "~/components/Domain/Recipe/RecipeIngredients.vue";
import RecipeIngredientHtml from "~/components/Domain/Recipe/RecipeIngredientHtml.vue";

interface MergerHistory {
  target: number;
  source: number;
  targetText: string;
  sourceText: string;
}

const instructionList = defineModel<RecipeStep[]>("modelValue", { required: true, default: () => [] });
const assets = defineModel<RecipeAsset[]>("assets", { required: true, default: () => [] });

const props = defineProps({
  recipe: {
    type: Object as () => RecipeView,
    required: true,
  },
  scale: {
    type: Number,
    default: 1,
  },
  ingredientStorageKey: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits(["click-instruction-field", "update:assets"]);

const i18n = useI18n();
const { isCookMode, isEditForm } = usePageState(props.recipe.slug);
const { extractIngredientReferences } = useExtractIngredientReferences();

const dialog = ref(false);
const disabledSteps = ref<number[]>([]);
const unusedIngredients = ref<RecipeIngredient[]>([]);
const usedIngredients = ref<RecipeIngredient[]>([]);

const showTitleEditor = ref<{ [key: string]: boolean }>({});

// ===============================================================
// UI State Helpers

function hasSectionTitle(title: string | undefined) {
  return !(title === null || title === "" || title === undefined);
}

watch(instructionList, (v) => {
  disabledSteps.value = [];

  v.forEach((element: RecipeStep) => {
    if (element.id !== undefined) {
      showTitleEditor.value[element.id!] = hasSectionTitle(element.title!);
    }
  });
}, { deep: true });

const showCookMode = ref(false);

onMounted(() => {
  instructionList.value.forEach((element: RecipeStep) => {
    if (element.id !== undefined) {
      showTitleEditor.value[element.id!] = hasSectionTitle(element.title!);
    }

    if (showCookMode.value === false && element.ingredientReferences && element.ingredientReferences.length > 0) {
      showCookMode.value = true;
    }

    showTitleEditor.value = { ...showTitleEditor.value };
  });

  if (assets.value === undefined) {
    emit("update:assets", []);
  }
});

const playPencilScratch = usePencilScratch();

function toggleDisabled(stepIndex: number) {
  if (isEditForm.value) {
    return;
  }
  if (disabledSteps.value.includes(stepIndex)) {
    const index = disabledSteps.value.indexOf(stepIndex);
    if (index !== -1) {
      disabledSteps.value.splice(index, 1);
    }
  }
  else {
    disabledSteps.value.push(stepIndex);
  }
  playPencilScratch();
}

function isChecked(stepIndex: number) {
  if (disabledSteps.value.includes(stepIndex) && !isEditForm.value) {
    return "disabled-card";
  }
}

function toggleShowTitle(id?: string) {
  if (!id) {
    return;
  }

  const showing = showTitleEditor.value[id];
  if (showing) {
    // visibility is re-derived from the title whenever the list changes, so hiding a section
    // only sticks if the title goes with it
    const step = instructionList.value.find(element => element.id === id);
    if (step) {
      step.title = "";
    }
  }

  showTitleEditor.value[id] = !showing;

  const temp = { ...showTitleEditor.value };
  showTitleEditor.value = temp;
}

function onDragEnd() {
  drag.value = false;
}

// ===============================================================
// Reference Linker
const activeLinkerIndex = ref(0);
const activeRefs = ref<string[]>([]);
const activeNoteReferenceIds = ref<string[]>([]);
const activeText = ref("");
const linkedNotesSheetOpen = ref(false);
const activeStepLinkedNotes = ref<RecipeNote[]>([]);

const availableDialogNextStep = computed(() => activeLinkerIndex.value < instructionList.value.length - 1);
const activeDialogStepText = computed(() => activeText.value);
const linkableNotes = computed(() => {
  return (props.recipe.notes ?? []).filter((note): note is RecipeNote & { referenceId: string } => note.referenceId != null);
});

function openReferenceDialog(idx: number) {
  activeLinkerIndex.value = idx;
  const step = instructionList.value[idx];

  if (!step) {
    activeRefs.value = [];
    activeNoteReferenceIds.value = [];
    return;
  }

  activeText.value = step.text;
  setUsedIngredients();
  activeRefs.value = (step.ingredientReferences ?? []).map(ref => ref.referenceId ?? "");
  activeNoteReferenceIds.value = (step.noteReferences ?? [])
    .map(ref => ref.referenceId)
    .filter((ref): ref is string => ref != null);
  dialog.value = true;
}

function updateCookModeVisibility() {
  showCookMode.value = false;
  instructionList.value.forEach((element) => {
    if (showCookMode.value === false && element.ingredientReferences && element.ingredientReferences.length > 0) {
      showCookMode.value = true;
    }
  });
}

function saveDialogLinks() {
  const step = instructionList.value[activeLinkerIndex.value];

  if (!step) {
    dialog.value = false;
    return;
  }

  step.ingredientReferences = activeRefs.value.map((referenceId) => {
    return { referenceId };
  });

  step.noteReferences = activeNoteReferenceIds.value.map((referenceId) => {
    return { referenceId };
  });

  updateCookModeVisibility();
  dialog.value = false;
}

function saveAndOpenNextDialogLinks() {
  const currentStepIndex = activeLinkerIndex.value;

  if (!availableDialogNextStep.value) {
    return;
  }

  saveDialogLinks();
  nextTick(() => openReferenceDialog(currentStepIndex + 1));
}

function closeDialog() {
  dialog.value = false;
}

function setUsedIngredients() {
  const usedRefs: { [key: string]: boolean } = {};

  instructionList.value.forEach((element, idx) => {
    if (idx === activeLinkerIndex.value) return;
    element.ingredientReferences?.forEach((ref) => {
      if (ref.referenceId) usedRefs[ref.referenceId] = true;
    });
  });

  usedIngredients.value = props.recipe.recipeIngredient.filter(ing => !!ing.referenceId && ing.referenceId in usedRefs);

  unusedIngredients.value = props.recipe.recipeIngredient.filter(ing => !!ing.referenceId && !(ing.referenceId in usedRefs));
}

watch(activeRefs, () => setUsedIngredients());

function autoSetReferences() {
  extractIngredientReferences(
    props.recipe.recipeIngredient,
    activeRefs.value,
    activeText.value,
  ).forEach(ingredient => activeRefs.value.push(ingredient));
}

const noteLookup = computed(() => {
  const results: { [key: string]: string } = {};
  return (props.recipe.notes ?? []).reduce((prev, note) => {
    if (note.referenceId != null) {
      prev[note.referenceId] = note.title;
    }
    return prev;
  }, results);
});

const notesByReferenceId = computed(() => {
  const results: { [key: string]: RecipeNote } = {};
  return (props.recipe.notes ?? []).reduce((prev, note) => {
    if (note.referenceId != null) {
      prev[note.referenceId] = note;
    }
    return prev;
  }, results);
});

function linkedNotesForStep(step: RecipeStep): RecipeNote[] {
  return (step.noteReferences ?? [])
    .map(ref => ref.referenceId ? notesByReferenceId.value[ref.referenceId] : undefined)
    .filter((note): note is RecipeNote => note !== undefined);
}

function openLinkedNotesSheet(step: RecipeStep) {
  activeStepLinkedNotes.value = linkedNotesForStep(step);
  linkedNotesSheetOpen.value = activeStepLinkedNotes.value.length > 0;
}

function hasLinkedIngredients(step: RecipeStep): boolean {
  return !!step.ingredientReferences && step.ingredientReferences.length > 0;
}

function hasLinkedNotes(step: RecipeStep): boolean {
  return linkedNotesForStep(step).length > 0;
}

function hasCookModeLinkedContent(step: RecipeStep): boolean {
  return hasLinkedIngredients(step) || hasLinkedNotes(step);
}

const ingredientLookup = computed(() => {
  const results: { [key: string]: RecipeIngredient } = {};
  return props.recipe.recipeIngredient.reduce((prev, ing) => {
    if (ing.referenceId === undefined) {
      return prev;
    }
    prev[ing.referenceId] = ing;
    return prev;
  }, results);
});

// Map each ingredient's referenceId to its section title
const ingredientSectionTitles = computed(() => {
  const titleMap: { [key: string]: string } = {};
  let currentTitle = "";

  // Go through all ingredients in order
  props.recipe.recipeIngredient.forEach((ingredient) => {
    if (ingredient.referenceId === undefined) {
      return;
    }

    // If this ingredient has a title, update the current title
    if (ingredient.title) {
      currentTitle = ingredient.title;
    }

    // Assign the current title to this ingredient
    titleMap[ingredient.referenceId] = currentTitle;
  });

  return titleMap;
});

const groupedUnusedIngredients = computed((): Record<string, RecipeIngredient[]> => {
  const groups: Record<string, RecipeIngredient[]> = {};

  // Group ingredients by section title
  unusedIngredients.value.forEach((ingredient) => {
    if (ingredient.referenceId === undefined) {
      return;
    }

    // Use the section title from the mapping, or fallback to the ingredient's own title
    const title = ingredientSectionTitles.value[ingredient.referenceId] || ingredient.title || "";
    (groups[title] ||= []).push(ingredient);
  });

  return groups;
});

const groupedUsedIngredients = computed((): Record<string, RecipeIngredient[]> => {
  const groups: Record<string, RecipeIngredient[]> = {};
  usedIngredients.value.forEach((ingredient) => {
    if (ingredient.referenceId === undefined) {
      return;
    }

    // Use the section title from the mapping, or fallback to the ingredient's own title
    const title = ingredientSectionTitles.value[ingredient.referenceId] || ingredient.title || "";
    (groups[title] ||= []).push(ingredient);
  });

  return groups;
});

// ===============================================================
// Instruction Merger
const mergeHistory = ref<MergerHistory[]>([]);

function mergeAbove(target: number, source: number) {
  const targetStep = instructionList.value[target];
  const sourceStep = instructionList.value[source];
  if (target < 0 || !targetStep || !sourceStep || target === source) {
    return;
  }

  mergeHistory.value.push({
    target,
    source,
    targetText: targetStep.text,
    sourceText: sourceStep.text,
  });

  targetStep.text += " " + sourceStep.text;
  instructionList.value.splice(source, 1);
}

function undoMerge(event: KeyboardEvent) {
  if (event.ctrlKey && event.code === "KeyZ") {
    if (!(mergeHistory.value?.length > 0)) {
      return;
    }

    const lastMerge = mergeHistory.value.pop();
    if (!lastMerge) {
      return;
    }

    const targetStep = instructionList.value[lastMerge.target];
    if (!targetStep) return;
    targetStep.text = lastMerge.targetText;
    instructionList.value.splice(lastMerge.source, 0, {
      id: uuid4(),
      title: "",
      text: lastMerge.sourceText,
      ingredientReferences: [],
      noteReferences: [],
    });
  }
}

function moveTo(dest: string, source: number) {
  const step = instructionList.value[source];
  if (!step) return;
  instructionList.value.splice(source, 1);
  if (dest === "top") {
    instructionList.value.unshift(step);
  }
  else {
    instructionList.value.push(step);
  }
}

function insert(dest: number) {
  instructionList.value.splice(dest, 0, { id: uuid4(), text: "", title: "", ingredientReferences: [], noteReferences: [] });
}

const previewStates = ref<Record<string, boolean>>({});

function togglePreviewState(id: string) {
  previewStates.value[id] = !previewStates.value[id];
}

async function removeStep(step: RecipeStep) {
  // Let a focused mobile textarea finish its blur before its row is unmounted.
  const focused = document.activeElement;
  if (focused instanceof HTMLElement && focused.closest("[data-step-id]")?.getAttribute("data-step-id") === step.id) {
    focused.blur();
  }
  await nextTick();
  instructionList.value = instructionList.value.filter(item => item !== step);
  if (step.id) {
    previewStates.value = Object.fromEntries(Object.entries(previewStates.value).filter(([id]) => id !== step.id));
    showTitleEditor.value = Object.fromEntries(Object.entries(showTitleEditor.value).filter(([id]) => id !== step.id));
  }
}

function toggleCollapseSection(index: number) {
  const sectionSteps: number[] = [];

  for (let i = index; i < instructionList.value.length; i++) {
    if (!(i === index) && hasSectionTitle(instructionList.value[i]?.title ?? "")) {
      break;
    }
    else {
      sectionSteps.push(i);
    }
  }

  const allCollapsed = sectionSteps.every(idx => disabledSteps.value.includes(idx));

  if (allCollapsed) {
    disabledSteps.value = disabledSteps.value.filter(idx => !sectionSteps.includes(idx));
  }
  else {
    disabledSteps.value = [...disabledSteps.value, ...sectionSteps];
  }
}

const drag = ref(false);

// ===============================================================
// Image Uploader
const api = useUserApi();
const { recipeAssetPath } = useStaticRoutes();

const loadingStates = ref<{ [key: number]: boolean }>({});

async function handleImageDrop(index: number, files: File[]) {
  if (!files) {
    return;
  }

  // Check if the file is an image
  const file = files[0];
  if (!file || !file.type.startsWith("image/")) {
    return;
  }

  loadingStates.value[index] = true;

  const { data } = await api.recipes.createAsset(props.recipe.slug, {
    name: file.name,
    icon: "mdi-file-image",
    file,
    extension: file.name.split(".").pop() || "",
  });

  loadingStates.value[index] = false;

  if (!data) {
    return; // TODO: Handle error
  }

  embedAsset(index, data);
}

/**
 * Images dragged out of another browser tab carry a URL instead of a file, so the server
 * fetches the image on our behalf.
 */
async function handleImageUrlDrop(index: number, url: string) {
  loadingStates.value[index] = true;

  const { data } = await api.recipes.createAssetFromUrl(props.recipe.slug, url);

  loadingStates.value[index] = false;

  if (!data) {
    alert.error(i18n.t("recipe.failed-to-attach-image"));
    return;
  }

  embedAsset(index, data);
}

/**
 * Some pages render images from blob: urls, which resolve only inside the origin that made
 * them. Nothing can read those bytes from here, so point the user at what does work.
 */
function notifyUnsupportedDrop() {
  alert.error(i18n.t("recipe.image-drop-unsupported"));
}

function embedAsset(index: number, asset: RecipeAsset) {
  const step = instructionList.value[index];
  if (!step) return;
  emit("update:assets", [...(assets.value ?? []), asset]);
  const assetUrl = recipeAssetPath(props.recipe.id, asset.fileName as string);
  const text = `<img src="${assetUrl}" height="100%" width="100%"/>`;
  step.text += text;
}

function openImageUpload(index: number) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async () => {
    if (input.files) {
      await handleImageDrop(index, Array.from(input.files));
      input.remove();
    }
  };
  input.click();
}
</script>

<style lang="css" scoped>
.reference-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.reference-step {
  padding: 16px;
  border-radius: 12px;
  background: rgb(var(--v-theme-background));
}
.reference-eyebrow,
.reference-help,
.reference-count {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 13px;
  line-height: 1.5;
}
.reference-eyebrow {
  font-weight: 600;
}
.reference-step-text {
  margin-top: 8px;
  font-size: 16px;
  line-height: 1.6;
  white-space: pre-wrap;
}
.reference-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.reference-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.reference-section-heading h3 {
  font-size: 16px;
  font-weight: 600;
}
.reference-detect {
  max-width: 100%;
  min-height: 44px;
  height: auto;
  padding-block: 10px;
  align-self: flex-start;
  text-transform: none;
  letter-spacing: normal;
  margin: 4px 0 8px;
}
.reference-detect :deep(.v-btn__content) {
  white-space: normal;
}
.reference-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.reference-group-title {
  font-size: 13px;
  font-weight: 600;
  margin: 8px 12px 4px;
}
.reference-reused {
  margin: 12px 0 4px;
}
.reference-option {
  padding: 4px 8px;
  min-height: 48px;
  border-radius: 10px;
  background: rgb(var(--v-theme-background));
}
.reference-option-selected {
  background: rgba(var(--v-theme-primary), 0.08);
}
.reference-option :deep(.v-label) {
  opacity: 1;
  font-size: 15px;
  line-height: 1.5;
  flex: 1;
  padding: 8px 0;
}
.reference-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.reference-footer-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
.reference-footer-actions .v-btn {
  text-transform: none;
  letter-spacing: normal;
}
@media (max-width: 600px) {
  .reference-body {
    padding: 16px;
    gap: 20px;
  }
  .reference-footer {
    align-items: flex-start;
  }
}

.v-card--link:before {
  background: none;
}

.recipe-section-title-input :deep(.v-field) {
  border-radius: 10px;
  background: rgb(var(--v-theme-fill));
}
.recipe-section-title-input.v-text-field :deep(input),
.recipe-step-title-input.v-text-field :deep(input) {
  font-size: 16px;
  font-weight: 500;
}
.recipe-step-title-input :deep(.v-field) {
  border-radius: 10px;
}

.recipe-step-editor-card {
  container-type: inline-size;
}

.recipe-step-editor-toolbar {
  gap: 8px;
}

.recipe-step-editor-actions {
  flex-shrink: 0;
}

@container (max-width: 480px) {
  .recipe-step-editor-toolbar {
    flex-wrap: wrap;
  }

  .recipe-step-title-input {
    flex: 1 1 100%;
    min-width: 0;
  }
}
.recipe-section-title-input :deep(.v-field),
.recipe-step-title-input :deep(.v-field) {
  --v-field-border-color: rgb(var(--v-theme-separator));
  --v-field-border-opacity: 1;
}
.recipe-section-title-input :deep(.v-field--focused),
.recipe-step-title-input :deep(.v-field--focused) {
  --v-field-border-color: rgb(var(--v-theme-primary));
}

/** Select all li under .markdown class */
.markdown :deep(ul > li) {
  display: list-item;
  list-style-type: disc !important;
}

/** Select all li under .markdown class */
.markdown :deep(ol > li) {
  display: list-item;
}

.flip-list-move {
  transition: transform 0.5s;
}

.no-move {
  transition: transform 0s;
}

.ghost {
  opacity: 0.5;
}

.list-group {
  min-height: 38px;
}

.list-group-item i {
  cursor: pointer;
}

.blur {
  filter: blur(2px);
}

.upload-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(var(--v-theme-media-scrim), 0.5);
  z-index: 1;
}

.v-text-field :deep(input) {
  font-size: 1.5rem;
}

.v-card-text {
  font-size: 1rem;
}

.recipe-step-title {
  /* Multiline display */
  white-space: normal;
  line-height: 1.25;
  word-break: break-word;
}

.summary-wrapper {
  flex: 1 1 auto;
  min-width: 0;
  /* wrapping in flex container */
  white-space: normal;
  overflow-wrap: anywhere;
  cursor: pointer;
}
.step-editor-heading {
  margin-bottom: 16px;
  font: 600 18px var(--bistro-body);
  color: rgb(var(--v-theme-on-surface));
}
.recipe-step-editor-toolbar {
  flex-wrap: wrap;
  gap: 12px;
}
.recipe-step-editor-toolbar .recipe-step-title-input {
  flex: 1 1 100%;
  min-width: 0;
  font-family: var(--bistro-body);
}
.recipe-step-title-input :deep(.v-label) {
  font-family: var(--bistro-body);
}
.recipe-step-editor-toolbar .recipe-step-editor-actions {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(var(--v-theme-separator), 0.5);
}
.step-editor-content-heading {
  margin: 0 0 12px;
  font: 600 14px var(--bistro-body);
  color: rgb(var(--v-theme-on-surface));
}
.recipe-step-editor-card .linked-ingredients-editor {
  margin-top: 16px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-fill), 0.5);
  font: 400 15px/1.5 var(--bistro-body);
}
</style>
