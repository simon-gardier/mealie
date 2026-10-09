import type { ShoppingListOut } from "~/lib/api/types/household";
import { useUserApi } from "~/composables/api";

export function useShoppingListRecipes(
  shoppingList: Ref<ShoppingListOut | null>,
  loadingCounter: Ref<number>,
  recipeReferenceLoading: Ref<boolean>,
  refresh: () => void,
  applyResponse?: (list: ShoppingListOut) => void,
) {
  const userApi = useUserApi();

  async function addRecipeReferenceToList(recipeId: string, quantity = 1) {
    if (!shoppingList.value || recipeReferenceLoading.value) return;
    loadingCounter.value += 1;
    recipeReferenceLoading.value = true;
    try {
      const { data } = await userApi.shopping.lists.addRecipes(shoppingList.value.id, [{ recipeId, recipeIncrementQuantity: quantity }]);
      if (data) {
        if (applyResponse) applyResponse(data as ShoppingListOut);
        else refresh();
      }
    }
    finally {
      recipeReferenceLoading.value = false;
      loadingCounter.value -= 1;
    }
  }

  async function removeRecipeReferenceToList(recipeId: string, quantity = 1) {
    if (!shoppingList.value || recipeReferenceLoading.value) return;
    loadingCounter.value += 1;
    recipeReferenceLoading.value = true;
    try {
      const { data } = await userApi.shopping.lists.removeRecipe(shoppingList.value.id, recipeId, quantity);
      if (data) {
        if (applyResponse) applyResponse(data as ShoppingListOut);
        else refresh();
      }
    }
    finally {
      recipeReferenceLoading.value = false;
      loadingCounter.value -= 1;
    }
  }

  return { addRecipeReferenceToList, removeRecipeReferenceToList };
}
