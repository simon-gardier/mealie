<template>
  <div class="gustau-rating" @click.prevent>
    <v-rating class="gustau-stars" :model-value="displayRating"
      :active-color="showGroupAverage ? 'grey-darken-1' : '#ffc24a'" color="#a84b18" length="5"
      :half-increments="showGroupAverage" :density="small ? 'compact' : 'default'" :size="small ? 'x-small' : undefined"
      :readonly="isReadonly" :hover="!isReadonly && canHover" :clearable="!!displayRating"
      @update:model-value="updateRating(+$event)">
      <template #item="{ isFilled, isHovered, props: itemProps }">
        <v-btn v-bind="itemProps" class="gustau-star" :class="{ 'gustau-star--active': isFilled || isHovered }" />
      </template>
    </v-rating>
  </div>
</template>

<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import { useUserSelfRatings } from "~/composables/use-users";

interface Props {
  readonly?: boolean;
  recipeId?: string;
  slug?: string;
  small?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  recipeId: "",
  slug: "",
  small: false,
});

const groupRating = defineModel<number>({ default: 0 });

const { isOwnGroup } = useLoggedInState();
const isReadonly = computed(() => props.readonly || !isOwnGroup.value);
const { userRatings, setRating } = useUserSelfRatings();

// on touch devices a tap fires mouseenter without a matching mouseleave, which leaves v-rating
// rendering the stuck hover value instead of the model value
const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");

const userRating = computed<number | null>(() => {
  return userRatings.value.find(r => r.recipeId === props.recipeId)?.rating ?? null;
});

const localUserRating = ref(userRating.value);

// while a write is in flight a refetch may still report the pre-click value, so ignore it
const pendingWrites = ref(0);
watch(userRating, (value) => {
  if (!pendingWrites.value) {
    localUserRating.value = value;
  }
});

// only fall back to the group average when we can't offer the user their own rating,
// and only when there's actually a group average to show. An unset rating may be null or 0
const showGroupAverage = computed(() => {
  return isReadonly.value && !localUserRating.value && !!groupRating.value;
});

const displayRating = computed(() => {
  return showGroupAverage.value ? groupRating.value : (localUserRating.value || 0);
});

async function updateRating(val?: number) {
  if (isReadonly.value) {
    return;
  }

  // user ratings are always whole stars
  let rating = Math.round(val ?? 0);
  if (rating === localUserRating.value) {
    rating = 0;
  }

  localUserRating.value = rating;

  pendingWrites.value++;
  try {
    await setRating(props.slug, rating, null);
  }
  finally {
    pendingWrites.value--;
  }
}
</script>

<style lang="scss" scoped>
.gustau-rating {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding-bottom: 0.25rem;
}

.gustau-stars {
  :deep(.v-rating__wrapper) {
    transition: transform 180ms ease;

    &:nth-of-type(1),
    &:nth-of-type(5) {
      transform: translateY(-3px);
    }

    &:nth-of-type(2),
    &:nth-of-type(4) {
      transform: translateY(0);
    }

    &:nth-of-type(3) {
      transform: translateY(3px);
    }
  }

  :deep(.gustau-star) {
    filter: drop-shadow(0 0 1px rgb(126 53 12 / 65%));
    text-shadow: 0 0 2px #7e350c;
    transition: filter 180ms ease, transform 180ms ease, color 180ms ease, text-shadow 180ms ease;
  }

  :deep(.gustau-star--active) {
    filter: drop-shadow(0 0 2px #ffe6a0) drop-shadow(0 0 4px #f69a2c);
    text-shadow: 0 0 3px #ffe6a0, 0 0 5px #f69a2c;
    transform: translateY(-1px);
  }
}
</style>
