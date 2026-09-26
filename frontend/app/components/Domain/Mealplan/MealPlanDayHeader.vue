<template>
  <v-card color="surface-variant" border="primary s-lg opacity-100" class="rounded-sm px-2"
    style="z-index: 2; background: rgb(var(--v-theme-surface-variant)) !important;">
    <v-container class="px-0 d-flex align-center justify-space-between" height="56px">
      <p
        :class="{ 'pl-2 flex-grow-1 text-center': true, 'text-primary font-weight-bold text-decoration-underline': isToday(day) }">
        {{ formatDay(day) }}
      </p>
      <slot />
    </v-container>
  </v-card>
</template>

<script setup lang="ts">
import { isSameDay } from "date-fns";

interface Props {
  day: Date;
};
defineProps<Props>();

const i18n = useI18n();

const formatDay = (date: Date) => {
  const formatted = i18n.d(date, { weekday: "long", day: "numeric", month: "long" });
  return formatted.charAt(0).toLocaleUpperCase(i18n.locale.value) + formatted.slice(1);
};

const isToday = (date: Date) => {
  return isSameDay(date, new Date());
};
</script>
