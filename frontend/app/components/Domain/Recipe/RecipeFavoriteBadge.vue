<template>
  <v-tooltip location="bottom" nudge-right="50" :color="buttonStyle ? 'info' : 'secondary'">
    <template #activator="{ props: tooltipProps }">
      <v-btn
        v-if="isFavorite || showAlways"
        icon
        :variant="buttonStyle ? 'tonal' : undefined"
        :rounded="buttonStyle ? 'circle' : undefined"
        size="small"
        :color="buttonStyle ? 'info' : 'secondary'"
        :fab="buttonStyle"
        v-bind="{ ...tooltipProps, ...$attrs }"
        @click.prevent="toggleFavorite"
      >
        <v-icon :size="!buttonStyle ? undefined : 'x-large'" :color="buttonStyle ? 'primary' : 'secondary'">
          {{ isFavorite ? $globals.icons.heart : $globals.icons.heartOutline }}
        </v-icon>
      </v-btn>
    </template>
    <span>{{ isFavorite ? $t("recipe.remove-from-favorites") : $t("recipe.add-to-favorites") }}</span>
  </v-tooltip>
</template>

<script setup lang="ts">
import { useUserSelfRatings } from "~/composables/use-users";

import { playRecipeSynesthesia } from "~/plugins/recipe-synesthesia.client";

interface Props {
  recipeId?: string;
  showAlways?: boolean;
  buttonStyle?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  recipeId: "",
  showAlways: false,
  buttonStyle: false,
});

const { userRatings, setFavorite } = useUserSelfRatings();

const isFavorite = computed(() => {
  const rating = userRatings.value.find(r => r.recipeId === props.recipeId);
  return rating?.isFavorite || false;
});

const favoritePending = ref(false);
async function toggleFavorite() {
  if (favoritePending.value) return;
  favoritePending.value = true;
  try {
    const favorite = !isFavorite.value;
    if (await setFavorite(props.recipeId, favorite) && favorite) playRecipeSynesthesia();
  }
  finally { favoritePending.value = false; }
}
</script>
