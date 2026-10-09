<template>
  <details class="analysis-settings">
    <summary>{{ $t('recipe.parser.analysis-method') }}</summary>
    <div class="settings-content">
      <div class="method-controls">
        <v-select
          v-model="selectedParser"
          class="method-select"
          :items="methodItems"
          :menu-props="{ contentClass: 'recipe-editor-overlay' }"
          item-title="text"
          item-value="value"
          variant="filled"
          density="compact"
          hide-details
          :aria-label="$t('recipe.parser.select-parser')"
          :disabled="disabled"
        >
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :subtitle="$t(`recipe.parser.method-${item.value}-description`)" />
          </template>
        </v-select>
        <v-btn variant="tonal" color="primary" :disabled="disabled" @click="reanalyze">
          {{ $t('recipe.parser.analyze-again') }}
        </v-btn>
        <v-menu :close-on-content-click="false" location="bottom end">
          <template #activator="{ props: infoProps }">
            <v-btn
              v-bind="infoProps"
              icon
              variant="text"
              color="primary"
              :aria-label="$t('recipe.parser.analysis-help')"
              :title="$t('recipe.parser.analysis-help')"
            >
              <v-icon>{{ $globals.icons.information }}</v-icon>
            </v-btn>
          </template>
          <v-card
            max-width="340"
            rounded="lg"
            class="pa-4"
            role="region"
            :aria-label="$t('recipe.parser.analysis-help')"
          >
            <p class="method-description">
              {{ $t(`recipe.parser.method-${selectedParser}-description`) }}
            </p>
            <p class="method-warning">
              {{ $t('recipe.parser.reanalysis-description') }}
            </p>
            <p v-if="selectedParser === 'nlp' && (showNlpLanguageHint || !isEnglishLocale)" class="text-body-2 mt-3">
              {{ $t('recipe.parser.natural-language-processor-english-only') }}
            </p>
          </v-card>
        </v-menu>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import type { MenuItem } from "~/components/global/BaseOverflowButton.vue";
import type { Parser } from "~/lib/api/user/recipes/recipe";

const props = defineProps<{ availableParsers: MenuItem[]; showNlpLanguageHint: boolean; disabled?: boolean }>();
const emit = defineEmits<{ parse: [] }>();
const currentParser = defineModel<Parser>({ default: "nlp" });
const selectedParser = ref(currentParser.value);
const { locale, t } = useI18n();
const methodItems = computed(() => props.availableParsers.filter(({ hide }) => !hide)
  .map(item => ({ ...item, text: t(`recipe.parser.method-${item.value}-title`) })));
const isEnglishLocale = computed(() => locale.value.toLowerCase().startsWith("en"));
watch(currentParser, value => selectedParser.value = value);
async function reanalyze() {
  currentParser.value = selectedParser.value;
  await nextTick();
  emit("parse");
}
</script>

<style scoped>
.analysis-settings {
  margin-top: 24px;
}
summary {
  display: list-item;
  padding: 16px 0;
  min-height: 44px;
  cursor: pointer;
  color: rgb(var(--v-theme-primary));
  font-size: 0.875rem;
  font-weight: 500;
}
.method-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.method-select {
  flex: 0 1 260px;
  min-width: 180px;
}
.method-select :deep(.v-field) {
  --v-input-control-height: 44px;
}
.method-select :deep(.v-field__input) {
  min-height: 44px;
  padding-top: 0;
  padding-bottom: 0;
}
.method-controls .v-btn {
  height: 44px;
  min-height: 44px;
  text-transform: none;
  letter-spacing: normal;
}
.method-description {
  margin-top: 10px;
  font-size: 0.875rem;
  line-height: 1.5;
}
.method-warning {
  margin-top: 6px;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: rgba(var(--v-theme-text-secondary), var(--v-secondary-label-opacity));
}
@media (max-width: 600px) {
  .method-select {
    flex: 1 1 200px;
  }
}
.settings-content {
  padding-bottom: 16px;
}
</style>
