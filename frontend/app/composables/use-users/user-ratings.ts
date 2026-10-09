import { useUserApi } from "~/composables/api";
import type { UserRatingSummary } from "~/lib/api/types/user";

const userRatings = ref<UserRatingSummary[]>([]);
const loading = ref(false);
const ready = ref(false);

export function resetUserSelfRatings() {
  userRatings.value = [];
  loading.value = false;
  ready.value = false;
}

export const useUserSelfRatings = function () {
  const auth = useMealieAuth();

  async function refreshUserRatings() {
    if (!auth.user.value || loading.value) {
      return;
    }

    loading.value = true;
    const api = useUserApi();

    const { data } = await api.users.getSelfRatings();
    userRatings.value = data?.ratings || [];

    loading.value = false;
    ready.value = true;
  }

  async function setRating(slug: string, rating: number | null, isFavorite: boolean | null) {
    loading.value = true;
    const api = useUserApi();

    const userId = auth.user.value?.id || "";
    await api.users.setRating(userId, slug, rating, isFavorite);

    loading.value = false;
    await refreshUserRatings();
  }

  async function setFavorite(recipeId: string, favorite: boolean) {
    if (!auth.user.value) return false;
    const api = useUserApi();
    const { response } = favorite
      ? await api.users.addFavorite(auth.user.value.id, recipeId)
      : await api.users.removeFavorite(auth.user.value.id, recipeId);
    if (!response || response.status < 200 || response.status >= 300) return false;
    const existing = userRatings.value.find(rating => rating.recipeId === recipeId);
    userRatings.value = [
      ...userRatings.value.filter(rating => rating.recipeId !== recipeId),
      { ...existing, recipeId, isFavorite: favorite },
    ];
    return true;
  }
  if (!ready.value) {
    refreshUserRatings();
  }

  return {
    userRatings,
    refreshUserRatings,
    setRating,
    setFavorite,
    ready,
  };
};
