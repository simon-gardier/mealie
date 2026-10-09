<template>
  <RecipeLoading
    v-if="loading"
    :label="waitingTextCalculated"
    :class="{ 'app-loader-compact': small || tiny }"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </RecipeLoading>
</template>

<script setup lang="ts">
import RecipeLoading from "~/components/Domain/Recipe/RecipeLoading.vue";

const props = defineProps({
  loading: {
    type: Boolean,
    default: true,
  },
  tiny: {
    type: Boolean,
    default: false,
  },
  small: {
    type: Boolean,
    default: false,
  },
  medium: {
    type: Boolean,
    default: true,
  },
  large: {
    type: Boolean,
    default: false,
  },
  waitingText: {
    type: String,
    default: undefined,
  },
});

const i18n = useI18n();
const waitingTextCalculated = computed(() => props.waitingText ?? i18n.t("general.loading"));
</script>

<style scoped>
.app-loader-compact {
  min-height: 44px;
  padding: 8px;
}
</style>
