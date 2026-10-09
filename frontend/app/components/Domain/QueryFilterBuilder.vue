<template>
  <v-defaults-provider :defaults="cookbookLayout ? { VSelect: { hideDetails: 'auto', density: 'comfortable' }, VTextField: { hideDetails: 'auto', density: 'comfortable' }, VAutocomplete: { hideDetails: 'auto', density: 'comfortable' }, VNumberInput: { hideDetails: 'auto', density: 'comfortable' } } : {}">
    <v-card class="ma-0" :class="{ 'cookbook-filters': cookbookLayout }" flat>
      <v-card-text class="ma-0 pa-0">
        <VueDraggable
          v-model="fields"
          handle=".handle"
          :delay="250"
          :delay-on-touch-only="true"
          v-bind="{
            animation: 200,
            group: cookbookLayout ? 'cookbook-filters' : 'recipe-instructions',
            ghostClass: cookbookLayout ? 'recipe-drop-target' : 'ghost',
          }"
          @start="drag = true"
          @end="onDragEnd"
        >
          <v-row
            v-for="(field, index) in fields"
            :key="field.id"
            class="filter-row d-flex flex-row flex-wrap mx-auto pb-2"
            :class="[!cookbookLayout && $vuetify.display.xs ? (Math.floor(index / 1) % 2 === 0 ? 'bg-dark' : 'bg-light') : '', { 'filter-row--advanced': cookbookLayout && showAdvanced }]"
            style="max-width: 100%;"
          >
            <!-- drag handle -->
            <v-col
              class="filter-drag"
              :cols="config.items.icon.cols(index)"
              :sm="config.items.icon.sm(index)"
              :class="$vuetify.display.smAndDown ? 'd-flex pa-0' : 'd-flex justify-end pr-6'"
            >
              <v-btn
                v-if="cookbookLayout"
                class="handle"
                icon
                variant="text"
                color="on-surface"
                :aria-label="$t('cookbook.reorder-filter')"
                :title="$t('cookbook.reorder-filter')"
                @keydown.up.prevent="moveField(index, -1)"
                @keydown.down.prevent="moveField(index, 1)"
              >
                <v-icon :icon="$globals.icons.arrowUpDown" size="20" />
              </v-btn>
              <v-icon v-else class="handle my-auto" :size="28" style="cursor: move;">
                {{ $globals.icons.arrowUpDown }}
              </v-icon>
            </v-col>

            <!-- and / or  -->
            <v-col
              v-if="index != 0 || (!cookbookLayout && $vuetify.display.smAndUp)"
              class="filter-join"
              :cols="config.items.logicalOperator.cols(index)"
              :sm="config.items.logicalOperator.sm(index)"
              :class="config.col.class"
            >
              <v-select
                v-if="index"
                :label="cookbookLayout ? $t('cookbook.filter-join') : undefined"
                :model-value="field.logicalOperator?.value"
                :items="[logOps.AND, logOps.OR]"
                item-title="label"
                item-value="value"
                :variant="cookbookLayout && !filledInputs ? 'outlined' : 'filled'"
                :menu-props="cookbookLayout ? { contentClass: 'recipe-editor-overlay' } : undefined"
                class="text-center"
                @update:model-value="setLogicalOperatorValue(field, index, $event as unknown as LogicalOperator)"
              />
            </v-col>

            <!-- left parenthesis -->
            <v-col
              v-if="showAdvanced"
              class="filter-left"
              :cols="config.items.leftParens.cols(index)"
              :sm="config.items.leftParens.sm(index)"
              :class="config.col.class"
            >
              <v-select
                :label="cookbookLayout ? $t('cookbook.open-group') : undefined"
                :model-value="field.leftParenthesis"
                :items="['', '(', '((', '(((']"
                :variant="cookbookLayout && !filledInputs ? 'outlined' : 'filled'"
                :menu-props="cookbookLayout ? { contentClass: 'recipe-editor-overlay' } : undefined"
                class="text-center"
                @update:model-value="setLeftParenthesisValue(field, index, $event)"
              />
            </v-col>

            <!-- field name -->
            <v-col
              class="filter-name"
              :cols="config.items.fieldName.cols(index)"
              :sm="config.items.fieldName.sm(index)"
              :class="config.col.class"
            >
              <v-select
                :label="cookbookLayout ? $t('cookbook.filter-field') : undefined"
                :model-value="field.label"
                :items="fieldDefs"
                :variant="cookbookLayout && !filledInputs ? 'outlined' : 'filled'"
                :menu-props="cookbookLayout ? { contentClass: 'recipe-editor-overlay' } : undefined"
                item-title="label"
                item-value="label"
                class="text-center"
                @update:model-value="setField(index, $event)"
              />
            </v-col>

            <!-- relational operator -->
            <v-col
              class="filter-condition"
              :cols="config.items.relationalOperator.cols(index)"
              :sm="config.items.relationalOperator.sm(index)"
              :class="config.col.class"
            >
              <v-select
                v-if="field.type !== 'boolean'"
                :label="cookbookLayout ? $t('cookbook.filter-condition') : undefined"
                :model-value="field.relationalOperatorValue?.value"
                :items="field.relationalOperatorChoices"
                item-title="label"
                item-value="value"
                :variant="cookbookLayout && !filledInputs ? 'outlined' : 'filled'"
                :menu-props="cookbookLayout ? { contentClass: 'recipe-editor-overlay' } : undefined"
                class="text-center"
                @update:model-value="setRelationalOperatorValue(field, index, $event as unknown as RelationalKeyword | RelationalOperator)"
              />
            </v-col>

            <!-- field value -->
            <v-col
              class="filter-value"
              :cols="config.items.fieldValue.cols(index)"
              :sm="config.items.fieldValue.sm(index)"
              :class="config.col.class"
            >
              <v-select
                v-if="field.fieldChoices"
                :label="cookbookLayout ? $t('general.value') : undefined"
                :model-value="field.values"
                :items="field.fieldChoices"
                item-title="label"
                item-value="value"
                multiple
                :variant="cookbookLayout && !filledInputs ? 'outlined' : 'filled'"
                :menu-props="cookbookLayout ? { contentClass: 'recipe-editor-overlay' } : undefined"
                @update:model-value="setFieldValues(field, index, $event)"
              />
              <v-text-field
                v-else-if="field.type === 'string'"
                :label="cookbookLayout ? $t('general.value') : undefined"
                :model-value="field.value"
                :variant="cookbookLayout && !filledInputs ? 'outlined' : 'filled'"
                @update:model-value="setFieldValue(field, index, $event)"
              />
              <v-number-input
                v-else-if="field.type === 'number'"
                :label="cookbookLayout ? $t('general.value') : undefined"
                :model-value="field.value as number || 0"
                :variant="cookbookLayout && !filledInputs ? 'outlined' : 'filled'"
                inset
                :min="0"
                :max="5"
                :precision="null"
                @update:model-value="setFieldValue(field, index, $event)"
              />
              <v-checkbox
                v-else-if="field.type === 'boolean'"
                :model-value="field.value"
                @update:model-value="setFieldValue(field, index, $event!)"
              />
              <v-menu
                v-else-if="field.type === 'date'"
                v-model="datePickers[index]"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                max-width="290px"
                min-width="auto"
              >
                <template #activator="{ props: activatorProps }">
                  <v-text-field
                    :label="cookbookLayout ? $t('general.value') : undefined"
                    :model-value="$d(safeNewDate(field.value + 'T00:00:00'))"
                    :variant="cookbookLayout && !filledInputs ? 'outlined' : 'filled'"
                    color="primary"
                    class="date-input"
                    v-bind="activatorProps"
                    readonly
                  />
                </template>
                <v-date-picker
                  :model-value="safeNewDate(field.value + 'T00:00:00')"
                  hide-header
                  :first-day-of-week="firstDayOfWeek"
                  :local="$i18n.locale"
                  @update:model-value="val => setFieldValue(field, index, val ? val.toISOString().slice(0, 10) : '')"
                />
              </v-menu>
              <!--
              Relative dates are assumed to be negative intervals with a unit of days.
              The input is a *positive*, interpreted internally as a *negative* offset.
            -->
              <v-number-input
                v-else-if="field.type === 'relativeDate'"
                :label="cookbookLayout ? $t('general.value') : undefined"
                :model-value="parseRelativeDateOffset(String(field.value ?? ''))"
                :suffix="$t('query-filter.dates.days-ago', parseRelativeDateOffset(String(field.value ?? '')))"
                :variant="cookbookLayout && !filledInputs ? 'outlined' : 'filled'"
                density="compact"
                inset
                :min="0"
                :precision="0"
                class="date-input"
                @update:model-value="setFieldValue(field, index, $event)"
              />
              <RecipeOrganizerSelector
                v-else-if="field.type === Organizer.Category"
                v-model="field.organizers"
                :selector-type="Organizer.Category"
                :show-add="false"
                :show-label="cookbookLayout"
                :show-icon="false"
                :variant="cookbookLayout && !filledInputs ? 'outlined' : 'filled'"
                @update:model-value="val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])"
              />
              <RecipeOrganizerSelector
                v-else-if="field.type === Organizer.Tag"
                v-model="field.organizers"
                :selector-type="Organizer.Tag"
                :show-add="false"
                :show-label="cookbookLayout"
                :show-icon="false"
                :variant="cookbookLayout && !filledInputs ? 'outlined' : 'filled'"
                @update:model-value="val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])"
              />
              <RecipeOrganizerSelector
                v-else-if="field.type === Organizer.Tool"
                v-model="field.organizers"
                :selector-type="Organizer.Tool"
                :show-add="false"
                :show-label="cookbookLayout"
                :show-icon="false"
                :variant="cookbookLayout && !filledInputs ? 'outlined' : 'filled'"
                @update:model-value="val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])"
              />
              <RecipeOrganizerSelector
                v-else-if="field.type === Organizer.Food"
                v-model="field.organizers"
                :selector-type="Organizer.Food"
                :show-add="false"
                :show-label="cookbookLayout"
                :show-icon="false"
                :variant="cookbookLayout && !filledInputs ? 'outlined' : 'filled'"
                @update:model-value="val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])"
              />
              <RecipeOrganizerSelector
                v-else-if="field.type === Organizer.Household"
                v-model="field.organizers"
                :selector-type="Organizer.Household"
                :show-add="false"
                :show-label="cookbookLayout"
                :show-icon="false"
                :variant="cookbookLayout && !filledInputs ? 'outlined' : 'filled'"
                @update:model-value="val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])"
              />
              <RecipeOrganizerSelector
                v-else-if="field.type === Organizer.User"
                v-model="field.organizers"
                :selector-type="Organizer.User"
                :show-add="false"
                :show-label="cookbookLayout"
                :show-icon="false"
                :variant="cookbookLayout && !filledInputs ? 'outlined' : 'filled'"
                @update:model-value="val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])"
              />
              <RecipeOrganizerSelector
                v-else-if="field.type === Organizer.Label"
                v-model="field.organizers"
                :selector-type="Organizer.Label"
                :show-add="false"
                :show-label="cookbookLayout"
                :show-icon="false"
                :variant="cookbookLayout && !filledInputs ? 'outlined' : 'filled'"
                @update:model-value="val => setFieldOrganizers(field, index, (val || []) as OrganizerBase[])"
              />
            </v-col>

            <!-- right parenthesis -->
            <v-col
              v-if="showAdvanced"
              class="filter-right"
              :cols="config.items.rightParens.cols(index)"
              :sm="config.items.rightParens.sm(index)"
              :class="config.col.class"
            >
              <v-select
                :label="cookbookLayout ? $t('cookbook.close-group') : undefined"
                :model-value="field.rightParenthesis"
                :items="['', ')', '))', ')))']"
                :variant="cookbookLayout && !filledInputs ? 'outlined' : 'filled'"
                :menu-props="cookbookLayout ? { contentClass: 'recipe-editor-overlay' } : undefined"
                class="text-center"
                @update:model-value="setRightParenthesisValue(field, index, $event)"
              />
            </v-col>

            <!-- field actions -->
            <v-col
              v-if="cookbookLayout || !$vuetify.display.smAndDown || index === fields.length - 1"
              class="filter-actions"
              :cols="config.items.fieldActions.cols(index)"
              :sm="config.items.fieldActions.sm(index)"
              :class="config.col.class"
            >
              <BaseButtonGroup
                :buttons="[
                  {
                    icon: $globals.icons.delete,
                    text: $t('general.delete'),
                    event: 'delete',
                    disabled: fields.length === 1,
                  },
                ]"
                class="my-auto"
                @delete="removeField(index)"
              />
            </v-col>
          </v-row>
        </VueDraggable>
      </v-card-text>
      <v-card-actions class="filter-toolbar">
        <v-row fluid class="filter-toolbar-row d-flex align-center ma-2">
          <div class="d-flex align-center">
            <v-switch
              v-model="showAdvanced"
              hide-details
              color="primary"
              :label="$t('general.show-advanced')"
              class="my-auto mr-4"
            />
            <BaseButton
              v-if="!$slots.actions"
              create
              :variant="cookbookLayout ? 'tonal' : undefined"
              :text="$t('general.add-field')"
              class="my-auto ml-4"
              @click="addField(fieldDefs[0])"
            />
          </div>
          <slot name="actions" :add-field="() => addField(fieldDefs[0])" />
        </v-row>
      </v-card-actions>
    </v-card>
  </v-defaults-provider>
</template>

<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";
import { useDebounceFn } from "@vueuse/core";
import { useHouseholdSelf } from "~/composables/use-households";
import RecipeOrganizerSelector from "~/components/Domain/Recipe/RecipeOrganizerSelector.vue";
import { Organizer } from "~/lib/api/types/non-generated";
import type {
  LogicalOperator,
  QueryFilterJSON,
  QueryFilterJSONPart,
  RelationalKeyword,
  RelationalOperator,
} from "~/lib/api/types/non-generated";
import { useCategoryStore, useFoodStore, useHouseholdStore, useLabelStore, useTagStore, useToolStore } from "~/composables/store";
import { useUserStore } from "~/composables/store/use-user-store";
import { type Field, type FieldDefinition, type FieldValue, type OrganizerBase, useQueryFilterBuilder } from "~/composables/use-query-filter-builder";

const props = defineProps({
  cookbookLayout: { type: Boolean, default: false },
  filledInputs: { type: Boolean, default: false },
  fieldDefs: {
    type: Array as () => FieldDefinition[],
    required: true,
  },
  initialQueryFilter: {
    type: Object as () => QueryFilterJSON | null,
    default: null,
  },
});

const emit = defineEmits<{
  (event: "input", value: string | undefined): void;
  (event: "inputJSON", value: QueryFilterJSON | undefined): void;
}>();

const { household } = useHouseholdSelf();
const {
  logOps,
  placeholderKeywords,
  getRelOps,
  buildQueryFilterString,
  getFieldFromFieldDef,
  isOrganizerType,
} = useQueryFilterBuilder();

const firstDayOfWeek = computed(() => {
  return household.value?.preferences?.firstDayOfWeek || 1;
});

const state = reactive({
  showAdvanced: false,
  qfValid: false,
  datePickers: [] as boolean[],
  drag: false,
});
const { showAdvanced, datePickers, drag } = toRefs(state);

const storeMap = {
  [Organizer.Category]: useCategoryStore(),
  [Organizer.Tag]: useTagStore(),
  [Organizer.Tool]: useToolStore(),
  [Organizer.Food]: useFoodStore(),
  [Organizer.Label]: useLabelStore(),
  [Organizer.Household]: useHouseholdStore(),
  [Organizer.User]: useUserStore(),
};

function onDragEnd(event: any) {
  state.drag = false;

  const oldIndex: number = event.oldIndex;
  const newIndex: number = event.newIndex;
  state.datePickers[oldIndex] = false;
  state.datePickers[newIndex] = false;
}

// add id to fields to prevent reactivity issues
type FieldWithId = Field & { id: number };
const fields = ref<FieldWithId[]>([]);

const uid = ref(1); // init uid to pass to fields
function useUid() {
  return uid.value++;
}
function addField(field: FieldDefinition | undefined) {
  if (!field) return;
  fields.value.push({
    ...getFieldFromFieldDef(field),
    id: useUid(),
  });
  state.datePickers.push(false);
}

function setField(index: number, fieldLabel: string) {
  state.datePickers[index] = false;
  const fieldDef = props.fieldDefs.find(fieldDef => fieldDef.label === fieldLabel);
  const currentField = fields.value[index];
  if (!fieldDef || !currentField) {
    return;
  }

  const resetValue = (fieldDef.type !== currentField.type) || (fieldDef.fieldChoices !== currentField.fieldChoices);
  const updatedField = { ...currentField, ...fieldDef };

  // we have to set this explicitly since it might be undefined
  updatedField.fieldChoices = fieldDef.fieldChoices;

  const nextField = {
    ...getFieldFromFieldDef(updatedField, resetValue),
    id: currentField.id,
  };
  fields.value[index] = nextField;

  // Defaults
  switch (nextField.type) {
    case "date":
      nextField.value = safeNewDate("");
      break;
    case "relativeDate":
      nextField.value = "$NOW-30d";
      break;

    default:
      break;
  }
}

function setLeftParenthesisValue(field: FieldWithId, index: number, value: string) {
  if (!fields.value.includes(field)) return;
  field.leftParenthesis = value;
}

function setRightParenthesisValue(field: FieldWithId, index: number, value: string) {
  if (!fields.value.includes(field)) return;
  field.rightParenthesis = value;
}

function setLogicalOperatorValue(field: FieldWithId, index: number, value: LogicalOperator | undefined) {
  if (!value) {
    value = logOps.value.AND.value;
  }

  if (!fields.value.includes(field)) return;
  field.logicalOperator = value ? logOps.value[value] : undefined;
}

function setRelationalOperatorValue(field: FieldWithId, index: number, value: RelationalKeyword | RelationalOperator) {
  const relOps = getRelOps(field.type);
  if (!fields.value.includes(field)) return;
  field.relationalOperatorValue = relOps.value[value];
}

function setFieldValue(field: FieldWithId, index: number, value: FieldValue) {
  if (!fields.value.includes(field)) return;
  state.datePickers[index] = false;

  if (field.type === "relativeDate") {
    // Value is set to an int representing the offset from $NOW
    // Values are assumed to be negative offsets ('-') with a unit of days ('d')
    field.value = `$NOW-${Math.abs(Number(value))}d`;
  }
  else {
    field.value = value;
  }
}

function setFieldValues(field: FieldWithId, index: number, values: FieldValue[]) {
  if (!fields.value.includes(field)) return;
  field.values = values;
}

function setFieldOrganizers(field: FieldWithId, index: number, organizers: OrganizerBase[]) {
  if (!fields.value.includes(field)) return;
  field.organizers = organizers;
  // Sync the values array with the organizers array
  field.values = organizers.map(org => org.id?.toString() || "").filter(id => id);
}

function removeField(index: number) {
  fields.value.splice(index, 1);
  state.datePickers.splice(index, 1);
}

function moveField(index: number, direction: number) {
  const destination = index + direction;
  if (index < 0 || index >= fields.value.length || destination < 0 || destination >= fields.value.length) return;
  const [field] = fields.value.splice(index, 1);
  if (!field) return;
  fields.value.splice(destination, 0, field);
  const [datePicker] = state.datePickers.splice(index, 1);
  state.datePickers.splice(destination, 0, datePicker ?? false);
}

function updateFields() {
  const qf = buildQueryFilterString(fields.value, state.showAdvanced);
  if (qf) {
    console.debug(`Set query filter: ${qf}`);
  }
  state.qfValid = !!qf;

  emit("input", qf || undefined);
  emit("inputJSON", qf ? buildQueryFilterJSON() : undefined);
}
const fieldsUpdater = useDebounceFn(updateFields, 500);

watch([fields, showAdvanced], () => {
  if (props.cookbookLayout) updateFields();
  else fieldsUpdater();
}, { deep: true, flush: "sync" });

async function hydrateOrganizers(field: FieldWithId, _index: number) {
  if (!field.values?.length || !isOrganizerType(field.type)) {
    return;
  }

  const { store, actions } = storeMap[field.type];
  if (!store.value.length) {
    await actions.refresh();
  }

  const organizers = field.values.map((value) => {
    const organizer = store.value.find(item => item?.id?.toString() === value);
    if (!organizer) {
      console.error(`Could not find organizer with id ${value}`);
      return undefined;
    }
    return organizer;
  });

  field.organizers = organizers.filter(organizer => organizer !== undefined) as OrganizerBase[];
  return field;
}

function initFieldsError(error = "") {
  if (error) {
    console.error(error);
  }

  fields.value = [];
  const firstField = props.fieldDefs[0];
  if (firstField) {
    addField(firstField);
  }
}

async function initializeFields() {
  if (!props.initialQueryFilter?.parts?.length) {
    return initFieldsError();
  }

  const initFields: FieldWithId[] = [];
  let error = false;

  for (const [index, part] of props.initialQueryFilter.parts.entries()) {
    const fieldDef = props.fieldDefs.find(fieldDef => fieldDef.name === part.attributeName);
    if (!fieldDef) {
      error = true;
      return initFieldsError(`Invalid query filter; unknown attribute name "${part.attributeName || ""}"`);
    }

    const field: FieldWithId = {
      ...getFieldFromFieldDef(fieldDef),
      id: useUid(),
    };

    const relOps = getRelOps(field.type);

    field.leftParenthesis = part.leftParenthesis || field.leftParenthesis;
    field.rightParenthesis = part.rightParenthesis || field.rightParenthesis;
    field.logicalOperator = part.logicalOperator
      ? logOps.value[part.logicalOperator]
      : field.logicalOperator;
    field.relationalOperatorValue = part.relationalOperator
      ? relOps.value[part.relationalOperator]
      : field.relationalOperatorValue;
    field.relationalOperatorValue = part.relationalOperator
      ? relOps.value[part.relationalOperator]
      : field.relationalOperatorValue;

    if (field.leftParenthesis || field.rightParenthesis) {
      state.showAdvanced = true;
    }

    if (field.fieldChoices?.length || isOrganizerType(field.type)) {
      if (typeof part.value === "string") {
        field.values = part.value ? [part.value] : [];
      }
      else {
        field.values = part.value || [];
      }

      if (isOrganizerType(field.type)) {
        await hydrateOrganizers(field, index);
      }
    }
    else if (field.type === "boolean") {
      const firstCharacter = String(part.value || "false").charAt(0).toLowerCase();
      field.value = ["t", "y", "1"].includes(firstCharacter);
    }
    else if (field.type === "number") {
      field.value = Number(part.value as string || "0");
      if (isNaN(field.value)) {
        error = true;
        return initFieldsError(`Invalid query filter; invalid number value "${(part.value || "").toString()}"`);
      }
    }
    else if (field.type === "date") {
      field.value = part.value as string || "";
      const date = new Date(field.value);
      if (isNaN(date.getTime())) {
        error = true;
        return initFieldsError(`Invalid query filter; invalid date value "${(part.value || "").toString()}"`);
      }
    }
    else {
      field.value = part.value as string || "";
    }

    initFields.push(field);
  }

  if (initFields.length && !error) {
    fields.value = initFields;
  }
  else {
    initFieldsError();
  }
}

onMounted(async () => {
  try {
    await initializeFields();
  }
  catch (error) {
    initFieldsError(`Error initializing fields: ${(error || "").toString()}`);
  }
});

function buildQueryFilterJSON(): QueryFilterJSON {
  const parts = fields.value.map((field) => {
    const part: QueryFilterJSONPart = {
      attributeName: field.name,
      leftParenthesis: field.leftParenthesis,
      rightParenthesis: field.rightParenthesis,
      logicalOperator: field.logicalOperator?.value,
      relationalOperator: field.relationalOperatorValue?.value,
    };

    if (field.fieldChoices?.length || isOrganizerType(field.type)) {
      part.value = field.values.map(value => value.toString());
    }
    else if (field.type === "boolean") {
      part.value = field.value ? "true" : "false";
    }
    else {
      part.value = (field.value || "").toString();
    }

    return part;
  });

  const qfJSON = { parts } as QueryFilterJSON;
  console.debug(`Built query filter JSON: ${JSON.stringify(qfJSON)}`);
  return qfJSON;
}

function safeNewDate(input: string): Date {
  const date = new Date(input);
  if (isNaN(date.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  return date;
}

/**
 * Parse a relative date string offset (e.g. $NOW-30d --> 30)
 *
 * Currently only values with a negative offset ('-') and a unit of days ('d') are supported
 */
function parseRelativeDateOffset(value: string): number {
  const defaultVal = 30;
  if (!value) {
    return defaultVal;
  }

  try {
    if (!value.startsWith(placeholderKeywords.value["$NOW"].value)) {
      return defaultVal;
    }

    const remainder = value.slice(placeholderKeywords.value["$NOW"].value.length);
    if (!remainder.startsWith("-")) {
      throw new Error("Invalid operator (not '-')");
    }

    if (remainder.slice(-1) !== "d") {
      throw new Error("Invalid unit (not 'd')");
    }

    // Slice off sign and unit
    return parseInt(remainder.slice(1, -1));
  }
  catch (error) {
    console.warn(`Unable to parse relative date offset from '${value}': ${error}`);
    return defaultVal;
  }
}

const config = computed(() => {
  const multiple = fields.value.length > 1;
  const adv = state.showAdvanced;

  return {
    col: {
      class: "d-flex justify-center align-end py-0",
    },
    items: {
      icon: {
        cols: (_index: number) => 2,
        sm: (_index: number) => 1,
        style: "width: fit-content;",
      },
      leftParens: {
        cols: (index: number) => (adv ? (index === 0 ? 2 : 0) : 0),
        sm: (_index: number) => (adv ? 1 : 0),
      },
      logicalOperator: {
        cols: (_index: number) => 0,
        sm: (_index: number) => (multiple ? 1 : 0),
      },
      fieldName: {
        cols: (index: number) => {
          if (adv) return index === 0 ? 8 : 12;
          return index === 0 ? 10 : 12;
        },
        sm: (_index: number) => (adv ? 2 : 3),
      },
      relationalOperator: {
        cols: (_index: number) => 12,
        sm: (_index: number) => 2,
      },
      fieldValue: {
        cols: (index: number) => {
          const last = index === fields.value.length - 1;
          if (adv) return last ? 8 : 10;
          return last ? 10 : 12;
        },
        sm: (_index: number) => (adv ? 3 : 4),
      },
      rightParens: {
        cols: (index: number) => (adv ? (index === fields.value.length - 1 ? 2 : 0) : 0),
        sm: (_index: number) => (adv ? 1 : 0),
      },
      fieldActions: {
        cols: (index: number) => (index === fields.value.length - 1 ? 2 : 0),
        sm: (_index: number) => 1,
      },
    },
  };
});
</script>

<style scoped>
* {
  font-size: 1em;
  --bg-opactity: calc(var(--v-hover-opacity) * var(--v-theme-overlay-multiplier));
}

.bg-dark {
  background-color: rgba(var(--v-theme-media-scrim), var(--bg-opactity));
}

.bg-light {
  background-color: rgba(var(--v-theme-media-foreground), var(--bg-opactity));
}

:deep(.date-input input) {
  text-align: end;
  padding-right: 6px;
}

:deep(.date-input .v-field__field) {
  align-items: center;
}

.cookbook-filters {
  background: transparent;
  container-type: inline-size;
  font-family: var(--bistro-body);
}
.cookbook-filters .filter-row {
  display: grid !important;
  grid-template-columns: 40px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.3fr) 40px;
  gap: 12px;
  margin: 0 0 12px !important;
  padding: 16px !important;
  border: 1px solid rgb(var(--v-theme-separator));
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  box-sizing: border-box;
}
.cookbook-filters .filter-row > div {
  width: auto;
  max-width: none;
  padding: 0 !important;
  min-width: 0;
  align-items: start !important;
}
.cookbook-filters .filter-drag {
  grid-column: 1;
  grid-row: 2;
  align-self: center;
  justify-content: center !important;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
.cookbook-filters .filter-name {
  grid-column: 2;
  grid-row: 2;
}
.cookbook-filters .filter-condition {
  grid-column: 3;
  grid-row: 2;
}
.cookbook-filters .filter-value {
  grid-column: 4;
  grid-row: 2;
  align-self: start;
  display: block !important;
}
.cookbook-filters .filter-value :deep(.v-input) {
  width: 100%;
  min-width: 0;
  margin-block: 0 !important;
  padding-block: 0 !important;
  align-self: start;
}
.cookbook-filters .filter-value :deep(.v-input__control) {
  align-self: start;
}
.cookbook-filters .filter-actions {
  grid-column: 5;
  grid-row: 2;
  align-self: center;
}
.cookbook-filters
  .filter-row:not(:has(.filter-join))
  :is(.filter-drag, .filter-name, .filter-condition, .filter-value, .filter-actions) {
  grid-row: 1;
}
.cookbook-filters .filter-row:not(:has(.filter-join)) :is(.filter-left, .filter-right) {
  grid-row: 2;
}
.cookbook-filters .filter-join {
  grid-column: 2 / 5;
  grid-row: 1;
  justify-self: start;
}
.cookbook-filters .filter-row > .filter-join {
  width: 180px;
  max-width: 100%;
}
.cookbook-filters .filter-left {
  grid-column: 2;
  grid-row: 3;
}
.cookbook-filters .filter-right {
  grid-column: 3;
  grid-row: 3;
}
.cookbook-filters .filter-toolbar {
  padding: 0;
  min-height: 44px;
}
.cookbook-filters .filter-toolbar-row {
  margin: 0 !important;
  justify-content: space-between;
  gap: 8px 16px;
  flex-wrap: wrap;
}
.cookbook-filters :deep(.v-select__selection-text) {
  white-space: normal;
}
.cookbook-filters .filter-actions :deep(.v-btn) {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}
.cookbook-filters .filter-drag .v-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  cursor: grab;
}
.cookbook-filters .recipe-drop-target {
  border: 2px dashed rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
}
.cookbook-filters :deep(.v-select__selection),
.cookbook-filters :deep(.v-label) {
  font-family: var(--bistro-body);
}
@container (max-width: 680px) {
  .cookbook-filters .filter-row {
    grid-template-columns: minmax(0, 1fr) 40px;
    gap: 12px;
    padding: 12px !important;
  }
  .cookbook-filters .filter-drag {
    grid-column: 2;
    grid-row: 3;
  }
  .cookbook-filters .filter-name {
    grid-column: 1;
    grid-row: 2;
  }
  .cookbook-filters .filter-condition {
    grid-column: 1;
    grid-row: 3;
  }
  .cookbook-filters .filter-value {
    grid-column: 1;
    grid-row: 4;
  }
  .cookbook-filters .filter-actions {
    grid-column: 2;
    grid-row: 2;
  }
  .cookbook-filters .filter-join {
    grid-column: 1;
    grid-row: 1;
  }
  .cookbook-filters .filter-left {
    grid-column: 1;
    grid-row: 5;
  }
  .cookbook-filters .filter-right {
    grid-column: 1;
    grid-row: 6;
  }
  .cookbook-filters .filter-row:not(:has(.filter-join)) :is(.filter-drag, .filter-condition) {
    grid-row: 2;
  }
  .cookbook-filters .filter-row:not(:has(.filter-join)) .filter-value {
    grid-row: 3;
  }
  .cookbook-filters .filter-row:not(:has(.filter-join)) .filter-left {
    grid-row: 4;
  }
  .cookbook-filters .filter-row:not(:has(.filter-join)) .filter-right {
    grid-row: 5;
  }
}
</style>
