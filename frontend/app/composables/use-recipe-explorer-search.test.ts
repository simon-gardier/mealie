import { computed, ref } from "vue";
import { afterEach, expect, test, vi } from "vitest";
import { clearRecipeExplorerSearchState, useRecipeExplorerSearch } from "./use-recipe-explorer-search";

vi.mock("~/composables/use-logged-in-state", () => ({ useLoggedInState: () => ({ isOwnGroup: ref(true) }) }));
vi.mock("~/composables/use-users/preferences", () => ({
  useUserSearchQuerySession: () => ref({ recipe: "" }),
  useUserSortPreferences: () => ref({ orderBy: "created_at", orderDirection: "desc" }),
}));
vi.mock("~/composables/store", () => {
  const store = () => ({ store: ref([]) });
  return Object.fromEntries(["Category", "Food", "Household", "Tag", "Tool"].flatMap(name => [[`use${name}Store`, store], [`usePublic${name}Store`, store]]));
});
afterEach(() => { clearRecipeExplorerSearchState("family"); vi.unstubAllGlobals(); });
test("filters by author, restores the URL selection, and clears it with reset", async () => {
  const author = "12345678-1234-4234-8234-123456789abc";
  const route = { query: { author } };
  const push = vi.fn();
  vi.stubGlobal("useRoute", () => route);
  vi.stubGlobal("useRouter", () => ({ currentRoute: ref(route), push, replace: vi.fn() }));
  const search = useRecipeExplorerSearch(computed(() => "family"));
  await search.initialize();
  expect(search.selectedAuthor.value).toBe(author);
  expect(search.passedQueryWithSeed.value.queryFilter).toBe(`userId = "${author}"`);
  expect(push).toHaveBeenLastCalledWith(expect.objectContaining({ query: expect.objectContaining({ author }) }));
  search.reset();
  await search.search();
  expect(search.selectedAuthor.value).toBeNull();
  expect(search.passedQueryWithSeed.value.queryFilter).toBeUndefined();
});
