<template>
  <v-item-group>
    <template v-for="btn in buttons">
      <BaseMenu v-if="btn.children" :key="'menu-' + btn.event" :large="large" :rounded="rounded" :activator="btn"
        :children="btn.children" @menu="(childEvent) => $emit(childEvent)" />
      <v-tooltip v-else :key="'btn-' + btn.event" open-delay="200" transition="slide-y-reverse-transition"
        density="compact" location="bottom" content-class="text-caption">
        <template #activator="{ props: tooltipProps }">
          <v-btn :tile="!rounded" icon :rounded="rounded ? 'circle' : undefined" :color="btn.color" :large="large"
            :disabled="btn.disabled" :style="stretch ? `width: ${maxButtonWidth};` : ''" variant="plain"
            v-bind="tooltipProps" @click="$emit(btn.event)">
            <v-icon> {{ btn.icon }} </v-icon>
          </v-btn>
        </template>
        <span>{{ btn.text }}</span>
      </v-tooltip>
    </template>
  </v-item-group>
</template>

<script setup lang="ts">
import type { ButtonOption } from "./BaseMenu.vue";
import BaseMenu from "./BaseMenu.vue";

const props = defineProps({
  buttons: {
    type: Array as () => ButtonOption[],
    required: true,
  },
  large: {
    type: Boolean,
    default: true,
  },
  stretch: {
    type: Boolean,
    default: false,
  },
  rounded: {
    type: Boolean,
    default: true,
  },
});

const maxButtonWidth = computed(() => `${100 / props.buttons.length}%`);
</script>
