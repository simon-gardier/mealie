<template>
  <v-card
    :color="endDate ? 'primary' : 'surface-variant'"
    :variant="endDate ? 'tonal' : undefined"
    border="primary s-lg opacity-100"
    class="rounded-sm px-2"
    :style="endDate ? 'z-index: 2;' : 'z-index: 2; background: rgb(var(--v-theme-surface-variant)) !important;'"
  >
    <v-container class="px-0 d-flex align-center justify-space-between" height="56px">
      <p
        :class="{ 'pl-2 flex-grow-1 text-center': true, 'text-primary font-weight-bold text-decoration-underline': isCurrent }"
      >
        {{ formatDay(day) }}<template v-if="endDate">
          - {{ formatDay(endDate) }}
        </template>
      </p>
      <slot />
    </v-container>
  </v-card>
</template>

<script setup lang="ts">
import { endOfDay, isSameDay, isWithinInterval, startOfDay } from "date-fns";

interface Props {
  day: Date;
  /** Set for a week, whose meals aren't planned for a specific day */
  endDate?: Date | null;
};
const props = defineProps<Props>();

const i18n = useI18n();

const formatDay = (date: Date) => {
  const formatted = i18n.d(date, { weekday: "long", day: "numeric", month: "long" });
  return formatted.charAt(0).toLocaleUpperCase(i18n.locale.value) + formatted.slice(1);
};

const isCurrent = computed(() => {
  const today = new Date();
  return props.endDate
    ? isWithinInterval(today, { start: startOfDay(props.day), end: endOfDay(props.endDate) })
    : isSameDay(props.day, today);
});
</script>
