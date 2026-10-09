<template>
  <v-text-field
    v-model="modelValue"
    :variant="variant"
    :label="$t('general.color')"
  >
    <template #append-inner>
      <v-btn
        class="elevation-0"
        icon
        variant="text"
        height="44"
        width="44"
        color="primary"
        :aria-label="$t('general.random-color')"
        :title="$t('general.random-color')"
        @click="setRandomHex"
      >
        <v-icon>
          {{ $globals.icons.refreshCircle }}
        </v-icon>
      </v-btn>
    </template>
    <template #prepend-inner>
      <v-menu
        v-model="menu"
        start
        nudge-left="30"
        nudge-top="20"
        :close-on-content-click="false"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            class="color-swatch"
            :style="{ backgroundColor: modelValue || undefined }"
            variant="outlined"
            width="36"
            height="36"
            min-width="36"
            :aria-label="$t('general.choose-color')"
            :title="$t('general.choose-color')"
          />
        </template>
        <v-card>
          <v-card-text class="pa-0">
            <v-color-picker
              v-model="modelValue"
              flat
              hide-inputs
              show-swatches
              swatches-max-height="200"
            />
          </v-card-text>
        </v-card>
      </v-menu>
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
defineProps<{ variant?: "filled" | "outlined" | "plain" | "underlined" | "solo" | "solo-filled" | "solo-inverted" }>();
const modelValue = defineModel({
  type: String,
  required: true,
});

const menu = ref(false);

function getRandomHex() {
  return "#000000".replace(/0/g, function () {
    return (~~(Math.random() * 16)).toString(16);
  });
}

function setRandomHex() {
  modelValue.value = getRandomHex();
}
</script>

<style scoped>
.color-swatch {
  border-radius: 8px;
  margin-inline-end: 8px;
}
</style>
