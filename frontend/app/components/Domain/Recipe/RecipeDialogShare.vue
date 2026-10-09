<template>
  <BaseDialog
    v-model="dialog"
    bottom-sheet
    :width="600"
    :title="$t('recipe-share.share-recipe')"
    :icon="$globals.icons.shareVariant"
    :cancel-text="$t('general.close')"
  >
    <div class="recipe-share-content">
      <p class="share-recipe-name">
        {{ name }}
      </p>
      <p class="share-description">
        {{ $t('recipe-share.description') }}
      </p>
      <section aria-labelledby="share-create-title">
        <h3 id="share-create-title">
          {{ $t('recipe-share.create-link') }}
        </h3>
        <div class="share-create-controls">
          <v-menu v-model="datePickerMenu" :close-on-content-click="false" max-width="360" content-class="recipe-editor-overlay">
            <template #activator="{ props: activatorProps }">
              <v-text-field
                :model-value="$d(expirationDate)"
                :label="$t('recipe-share.expiration-date')"
                :hint="$t('recipe-share.default-30-days')"
                persistent-hint
                :prepend-inner-icon="$globals.icons.calendar"
                v-bind="activatorProps"
                readonly
                density="comfortable"
              />
            </template>
            <v-date-picker v-model="expirationDate" hide-header :first-day-of-week="firstDayOfWeek" :locale="$i18n.locale" @update:model-value="datePickerMenu = false" />
          </v-menu>
          <v-btn
            variant="tonal"
            color="primary"
            height="48"
            :loading="creating"
            :disabled="loadingTokens"
            @click="createNewToken"
          >
            <v-icon start>
              {{ $globals.icons.createAlt }}
            </v-icon>
            {{ $t('recipe-share.create-link') }}
          </v-btn>
        </div>
      </section>
      <section aria-labelledby="share-links-title" class="share-links">
        <h3 id="share-links-title">
          {{ $t('recipe-share.your-links') }}
        </h3>
        <v-progress-linear v-if="loadingTokens" indeterminate color="primary" class="mt-3" :aria-label="$t('general.loading')" />
        <BaseEmptyState v-else-if="!tokens.length" :message="$t('recipe-share.no-links')" :icon="$globals.icons.link" />
        <ul v-else class="share-link-list">
          <li v-for="(token, index) in tokens" :key="token.id" class="share-link-card">
            <div class="share-link-heading">
              <v-icon :icon="$globals.icons.link" color="primary" size="20" aria-hidden="true" />
              <div class="share-link-details">
                <h4>{{ $t('recipe-share.link-number', { number: index + 1 }) }}</h4>
                <p>{{ $t('recipe-share.expires-at') }} {{ $d(new Date(token.expiresAt!), 'short') }}</p>
              </div>
              <v-btn
                color="error"
                icon
                variant="text"
                :loading="deletingIds.includes(token.id)"
                :aria-label="$t('recipe-share.revoke-link')"
                :title="$t('recipe-share.revoke-link')"
                @click="deleteToken(token.id)"
              >
                <v-icon>{{ $globals.icons.delete }}</v-icon>
              </v-btn>
            </div>
            <div class="share-link-actions">
              <v-btn variant="tonal" color="primary" height="44" @click="copyTokenLink(token.id)">
                <v-icon start>
                  {{ $globals.icons.contentCopy }}
                </v-icon>
                {{ $t('recipe-share.copy-link') }}
              </v-btn>
              <v-btn v-if="shareIsSupported" variant="text" height="44" @click="shareRecipe(token.id)">
                <v-icon start>
                  {{ $globals.icons.shareVariant }}
                </v-icon>
                {{ $t('recipe-share.share') }}
              </v-btn>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { useClipboard, useShare, whenever } from "@vueuse/core";
import type { RecipeShareToken } from "~/lib/api/types/recipe";
import { useUserApi } from "~/composables/api";
import { useHouseholdSelf } from "~/composables/use-households";
import { alert } from "~/composables/use-toast";

interface Props {
  recipeId: string;
  name: string;
}
const props = defineProps<Props>();

const dialog = defineModel<boolean>({ default: false });

const datePickerMenu = ref(false);
const expirationDate = ref(new Date(Date.now() - new Date().getTimezoneOffset() * 60000));
const tokens = ref<RecipeShareToken[]>([]);
const creating = ref(false);
const loadingTokens = ref(false);
const deletingIds = ref<string[]>([]);

whenever(
  () => dialog.value,
  () => {
    // Set expiration date to today + 30 Days
    const today = new Date();
    expirationDate.value = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    refreshTokens();
  },
);

const i18n = useI18n();
const auth = useMealieAuth();
const { household } = useHouseholdSelf();
const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");

const firstDayOfWeek = computed(() => {
  return household.value?.preferences?.firstDayOfWeek || 1;
});

// ============================================================
// Token Actions

const userApi = useUserApi();

async function createNewToken() {
  if (creating.value) return;
  creating.value = true;
  try {
    // Convert expiration date to timestamp
    const { data } = await userApi.recipes.share.createOne({
      recipeId: props.recipeId,
      expiresAt: expirationDate.value.toISOString(),
    });

    if (data) {
      tokens.value.push(data);
    }
  }
  finally {
    creating.value = false;
  }
}

async function deleteToken(id: string) {
  if (deletingIds.value.includes(id)) return;
  deletingIds.value.push(id);
  try {
    const { response } = await userApi.recipes.share.deleteOne(id);
    if (response) tokens.value = tokens.value.filter(token => token.id !== id);
  }
  finally {
    deletingIds.value = deletingIds.value.filter(tokenId => tokenId !== id);
  }
}

async function refreshTokens() {
  loadingTokens.value = true;
  try {
    const { data } = await userApi.recipes.share.getAll(1, -1, { recipe_id: props.recipeId });

    if (data) {
      // @ts-expect-error - TODO: This routes doesn't have pagination, but the type are mismatched.
      tokens.value = data ?? [];
    }
  }
  finally {
    loadingTokens.value = false;
  }
}

const { share, isSupported: shareIsSupported } = useShare();
const { copy, copied, isSupported } = useClipboard();

function getTokenLink(token: string) {
  return `${window.location.origin}/g/${groupSlug.value}/shared/r/${token}`;
}

async function copyTokenLink(token: string) {
  if (isSupported.value) {
    await copy(getTokenLink(token));
    if (copied.value) {
      alert.success(i18n.t("recipe-share.recipe-link-copied-message") as string);
    }
    else {
      alert.error(i18n.t("general.clipboard-copy-failure") as string);
    }
  }
  else {
    alert.error(i18n.t("general.clipboard-not-supported") as string);
  }
}

async function shareRecipe(token: string) {
  if (shareIsSupported.value) {
    share({
      title: props.name,
      url: getTokenLink(token),
    });
  }
  else {
    await copyTokenLink(token);
  }
}
</script>

<style scoped>
.recipe-share-content {
  padding: 24px;
}
.share-recipe-name {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.share-description {
  margin: 8px 0 24px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 14px;
  line-height: 1.5;
}
h3 {
  font-family: var(--bistro-body);
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
}
.share-create-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
}
.share-links {
  margin-top: 24px;
}
.share-link-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 12px;
}
.share-link-card {
  padding: 12px 16px;
  border: 1px solid rgb(var(--v-theme-separator));
  border-radius: 14px;
}
.share-link-heading {
  display: flex;
  align-items: center;
  gap: 12px;
}
.share-link-details {
  flex: 1;
  min-width: 0;
}
.share-link-details h4 {
  font-size: 14px;
  font-weight: 600;
}
.share-link-details p {
  margin-top: 4px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
.share-link-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
@media (max-width: 600px) {
  .recipe-share-content {
    padding: 16px;
  }
  .share-create-controls {
    grid-template-columns: 1fr;
  }
  .share-create-controls > .v-btn {
    justify-self: start;
  }
}
</style>
