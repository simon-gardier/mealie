<template>
  <div v-bind="$attrs">
    <v-toolbar class="fixed-bar" style="z-index: 2; position: sticky; background: transparent; box-shadow: none;"
      density="compact" elevation="0">
      <BaseDialog v-model="deleteDialog" bottom-sheet :title="$t('recipe.delete-recipe')" color="error"
        :icon="$globals.icons.alertCircle" can-confirm @confirm="emitDelete()">
        <v-card-text>
          {{ $t("recipe.delete-confirmation") }}
        </v-card-text>
      </BaseDialog>

      <v-spacer v-if="!open" />
      <div v-if="!open" class="custom-btn-group ma-1">
        <v-tooltip v-if="recipe.userId" location="bottom" color="info">
          <template #activator="{ props: tooltipProps }">
            <v-btn icon variant="flat" rounded="circle" size="small" color="info" class="mr-1 owner-avatar-btn"
              v-bind="tooltipProps">
              <UserAvatar :user-id="recipe.userId" :tooltip="false" size="32" />
            </v-btn>
          </template>
          <span>{{ ownerName || $t('general.owner') }}</span>
        </v-tooltip>
        <v-tooltip location="bottom" color="info">
          <template #activator="{ props: tooltipProps }">
            <v-btn icon variant="flat" rounded="circle" size="small" color="info" class="mr-1" v-bind="tooltipProps"
              @click="$emit('cook-mode')">
              <v-icon size="x-large" color="white">
                {{ $globals.icons.primary }}
              </v-icon>
            </v-btn>
          </template>
          <span>{{ $t("recipe.cook-mode") }}</span>
        </v-tooltip>
        <v-tooltip v-if="recipe.orgURL" location="bottom" color="info">
          <template #activator="{ props: tooltipProps }">
            <v-btn icon variant="flat" rounded="circle" size="small" color="info" class="mr-1" :href="recipe.orgURL"
              target="_blank" v-bind="tooltipProps">
              <v-icon size="x-large" color="white">
                {{ $globals.icons.link }}
              </v-icon>
            </v-btn>
          </template>
          <span>{{ $t("recipe.original-url") }}</span>
        </v-tooltip>
        <RecipeFavoriteBadge v-if="loggedIn" color="info" button-style :recipe-id="recipe.id!" show-always />
        <RecipeTimelineBadge v-if="loggedIn" class="ml-1" color="info" button-style :slug="recipe.slug"
          :recipe-name="recipe.name!" />
        <div v-if="loggedIn">
          <v-tooltip v-if="canEdit" location="bottom" color="info">
            <template #activator="{ props: tooltipProps }">
              <v-btn icon variant="flat" rounded="circle" size="small" color="info" class="ml-1" v-bind="tooltipProps"
                @click="$emit('edit', true)">
                <v-icon size="x-large" color="white">
                  {{ $globals.icons.edit }}
                </v-icon>
              </v-btn>
            </template>
            <span>{{ $t("general.edit") }}</span>
          </v-tooltip>
        </div>

        <RecipeContextMenu show-print :menu-top="false" :name="recipe.name!" :slug="recipe.slug!"
          :menu-icon="$globals.icons.dotsVertical" fab color="info" :card-menu="false" :recipe="recipe"
          :recipe-id="recipe.id!" :recipe-scale="recipeScale" :use-items="{
            edit: false,
            download: loggedIn,
            duplicate: loggedIn,
            mealplanner: loggedIn,
            shoppingList: loggedIn,
            print: true,
            printPreferences: true,
            share: loggedIn,
            recipeActions: true,
            delete: loggedIn,
          }" class="ml-1" @print="$emit('print')" />
      </div>
      <v-spacer v-if="open" />
      <v-menu v-if="open" offset-y top nudge-top="6" :close-on-content-click="false">
        <template #activator="{ props: menuProps }">
          <v-tooltip location="bottom">
            <template #activator="{ props: tooltipProps }">
              <v-btn class="editor-action rounded-circle ma-1" size="small" color="info" variant="elevated" icon
                v-bind="{ ...menuProps, ...tooltipProps }">
                <UserAvatar :user-id="recipe.userId" :tooltip="false" size="32" />
              </v-btn>
            </template>
            <span>{{ ownerName || $t("general.owner") }}</span>
          </v-tooltip>
        </template>
        <v-card class="pa-2 owner-menu">
          <slot name="owner" />
        </v-card>
      </v-menu>
      <div v-if="open" class="custom-btn-group edit-actions ma-1">
        <slot />
        <v-tooltip v-for="(btn, index) in editorButtons" :key="index" location="bottom">
          <template #activator="{ props: tooltipProps }">
            <v-btn class="editor-action rounded-circle" size="small" :color="btn.color" variant="elevated" icon
              v-bind="tooltipProps" @click="emitHandler(btn.event)">
              <v-icon>{{ btn.icon }}</v-icon>
            </v-btn>
          </template>
          <span>{{ btn.text }}</span>
        </v-tooltip>
      </div>
      <v-tooltip v-if="open" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <v-btn class="editor-action rounded-circle ma-1" size="small" variant="elevated" icon v-bind="tooltipProps"
            @click="emitHandler(CLOSE_EVENT)">
            <v-icon>{{ $globals.icons.close }}</v-icon>
          </v-btn>
        </template>
        <span>{{ $t("general.close") }}</span>
      </v-tooltip>
    </v-toolbar>
  </div>
</template>

<script setup lang="ts">
import RecipeContextMenu from "./RecipeContextMenu/RecipeContextMenu.vue";
import RecipeFavoriteBadge from "./RecipeFavoriteBadge.vue";
import RecipeTimelineBadge from "./RecipeTimelineBadge.vue";
import UserAvatar from "~/components/Domain/User/UserAvatar.vue";
import { useUserStore } from "~/composables/store/use-user-store";
import type { Recipe } from "~/lib/api/types/recipe";

const SAVE_EVENT = "save";
const DELETE_EVENT = "delete";
const CLOSE_EVENT = "close";
const JSON_EVENT = "json";

interface Props {
  recipe: Recipe;
  slug: string;
  recipeScale?: number;
  open: boolean;
  name: string;
  loggedIn?: boolean;
  recipeId: string;
  canEdit?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  recipeScale: 1,
  loggedIn: false,
  canEdit: false,
});

const emit = defineEmits(["print", "input", "save", "delete", "close", "json", "edit", "cook-mode"]);

const deleteDialog = ref(false);

const { store: groupMembers } = useUserStore();
const ownerName = computed(() => groupMembers.value.find(member => member.id === props.recipe.userId)?.fullName ?? "");

const i18n = useI18n();
const { $globals } = useNuxtApp();

const editorButtons = [
  {
    text: i18n.t("general.json"),
    icon: $globals.icons.codeBraces,
    event: JSON_EVENT,
    color: "accent",
  },
  {
    text: i18n.t("general.delete"),
    icon: $globals.icons.delete,
    event: DELETE_EVENT,
    color: "error",
  },
  {
    text: i18n.t("general.save"),
    icon: $globals.icons.save,
    event: SAVE_EVENT,
    color: "success",
  },
];

function emitHandler(event: string) {
  switch (event) {
    case CLOSE_EVENT:
      emit("close");
      emit("input", false);
      break;
    case DELETE_EVENT:
      deleteDialog.value = true;
      break;
    default:
      emit(event as any);
      break;
  }
}

function emitDelete() {
  emit("delete");
  emit("input", false);
}
</script>

<style scoped>
.custom-btn-group {
  flex: 0, 1, auto;
  display: inline-flex;
}

.edit-actions {
  gap: 0.25rem;
}

.owner-avatar-btn {
  padding: 1px !important;
}

.owner-menu {
  width: max-content;
  min-width: 240px;
  max-width: calc(100vw - 32px);
}

.vertical {
  flex-direction: column !important;
}

.sticky {
  margin-left: auto;
  position: fixed !important;
  margin-top: 4.25rem;
}

.fixed-bar {
  position: sticky;
  top: 4.5em;
  z-index: 2;
  background: transparent !important;
  box-shadow: none !important;
  min-height: 0 !important;
  height: 48px;
  padding: 0 8px;
}

.fixed-bar-mobile {
  top: 1.5em !important;
}
</style>
