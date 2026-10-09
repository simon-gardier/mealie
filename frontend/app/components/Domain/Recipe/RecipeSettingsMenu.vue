<template>
  <div class="text-center">
    <v-menu content-class="recipe-editor-overlay" location="bottom end" :close-on-content-click="false">
      <template #activator="{ props }">
        <v-btn
          color="primary"
          class="editor-action rounded-circle"
          size="small"
          variant="tonal"
          icon
          v-bind="props"
          :aria-label="$t('recipe.recipe-settings')"
        >
          <v-icon>{{ $globals.icons.cog }}</v-icon>
        </v-btn>
      </template>
      <v-card class="recipe-settings-menu" width="360">
        <v-card-title class="px-5 pt-5 pb-3">
          <div>
            {{ $t("recipe.recipe-settings") }}
          </div>
        </v-card-title>
        <v-divider class="mx-2" />
        <v-card-text class="px-5 pt-3 pb-5">
          <RecipeSettingsSwitches v-model="value" :is-owner="isOwner" />
        </v-card-text>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import RecipeSettingsSwitches from "./RecipeSettingsSwitches.vue";

const value = defineModel<object>({ required: true });

defineProps<{ isOwner?: boolean }>();
</script>

<style lang="scss" scoped></style>
