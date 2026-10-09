<template>
  <div>
    <v-card-title class="recipe-comments-title headline pb-3">
      <v-icon class="mr-2">
        {{ $globals.icons.commentTextMultipleOutline }}
      </v-icon>
      {{ $t("recipe.comments") }}
    </v-card-title>
    <v-divider class="mx-2" />
    <div v-if="user.id" class="d-flex flex-column">
      <div class="d-flex mt-3" style="gap: 10px">
        <UserAvatar :tooltip="false" size="40" :user-id="user.id" />

        <v-textarea
          v-model="comment"
          class="recipe-comment-input"
          hide-details
          density="compact"
          
          variant="filled"
          auto-grow
          rows="2"
          :label="$t('recipe.join-the-conversation')"
        />
      </div>
      <div class="comment-composer-actions">
        <v-btn
          variant="tonal"
          color="primary"
          class="comment-send-button"
          :prepend-icon="$globals.icons.arrowRightBold"
          :disabled="!comment.trim()"
          @click="submitComment"
        >
          {{ $t('general.submit') }}
        </v-btn>
      </div>
    </div>
    <BaseEmptyState
      v-if="!recipe.comments.length"
      :message="$t('recipe.no-comments')"
      :icon="$globals.icons.commentTextMultipleOutline"
    />
    <div v-for="recipeComment in recipe.comments" :key="recipeComment.id" class="d-flex my-2" style="gap: 10px">
      <UserAvatar :tooltip="false" size="40" :user-id="recipeComment.userId" />
      <v-card variant="outlined" class="recipe-comment-card flex-grow-1">
        <v-card-text class="comment-content">
          <div class="comment-header">
            <span class="comment-author">{{ recipeComment.user.fullName }}</span>
            <time class="comment-date" :datetime="recipeComment.createdAt">{{ $d(Date.parse(recipeComment.createdAt), "medium") }}</time>
          </div>
          <SafeMarkdown class="comment-body" :source="recipeComment.text" />
        </v-card-text>
        <v-card-actions v-if="user.id == recipeComment.user.id || user.admin" class="comment-actions justify-end mt-0 pt-0">
          <v-btn
            v-if="user.id == recipeComment.user.id || user.admin"
            color="error"
            icon
            rounded="circle"
            variant="plain"
            :title="$t('general.delete')"
            :aria-label="$t('general.delete')"
            @click="deleteComment(recipeComment.id)"
          >
            <v-icon>{{ $globals.icons.delete }}</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import type { Recipe } from "~/lib/api/types/recipe";
import UserAvatar from "~/components/Domain/User/UserAvatar.vue";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import { usePageUser } from "~/composables/recipe-page/shared-state";
import SafeMarkdown from "~/components/global/SafeMarkdown.vue";

const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });
const api = useUserApi();
const { user } = usePageUser();
const comment = ref("");

async function submitComment() {
  const text = comment.value.trim();
  if (!text) {
    return;
  }
  const { data } = await api.recipes.comments.createOne({
    recipeId: recipe.value.id,
    text,
  });

  if (data) {
    recipe.value.comments.push(data);
  }

  comment.value = "";
}

async function deleteComment(id: string) {
  const { response } = await api.recipes.comments.deleteOne(id);

  if (response?.status === 200) {
    recipe.value.comments = recipe.value.comments.filter(comment => comment.id !== id);
  }
}
</script>

<style scoped>
.recipe-comments-title {
  font-family: inherit;
  font-size: 18px;
  font-weight: 600;
}

.comment-composer-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.comment-send-button {
  min-height: 44px;
  border-radius: 10px;
  padding-inline: 16px;
  font-size: 14px;
  letter-spacing: normal;
  box-shadow: none;
}
.recipe-comment-input {
  --v-field-border-opacity: 1;
}

.recipe-comment-card {
  border-color: rgba(var(--v-border-color), 0.75);
  border-radius: 12px;
  background-color: rgb(var(--v-theme-surface));
}

.comment-date::first-letter {
  text-transform: uppercase;
}
.comment-content {
  padding: 16px;
}
.comment-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 12px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(var(--v-theme-separator), 0.45);
}
.comment-author {
  font-size: 15px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  overflow-wrap: anywhere;
}
.comment-date {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5;
  color: rgba(var(--v-theme-text-secondary), 0.8);
}
.comment-body {
  font-size: 15px;
  font-weight: 400;
  line-height: 1.6;
  color: rgb(var(--v-theme-on-surface));
  overflow-wrap: anywhere;
}
.comment-body :deep(p) {
  margin: 0 0 8px;
}
.comment-body :deep(> :last-child) {
  margin-bottom: 0;
}
.comment-actions {
  min-height: 0;
  padding: 0 8px 8px;
}
@media (max-width: 599px) {
  .comment-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
