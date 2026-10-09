import { ref } from "vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { resetUserSelfRatings, useUserSelfRatings } from "./user-ratings";

const api = vi.hoisted(() => ({
  getSelfRatings: vi.fn(), addFavorite: vi.fn(), removeFavorite: vi.fn(),
}));
vi.mock("~/composables/api", () => ({ useUserApi: () => ({ users: api }) }));
beforeEach(() => {
  resetUserSelfRatings();
  vi.stubGlobal("useMealieAuth", () => ({ user: ref({ id: "user" }) }));
  api.getSelfRatings.mockResolvedValue({ data: { ratings: [{ recipeId: "recipe", rating: 4, isFavorite: true }] } });
  api.addFavorite.mockResolvedValue({ response: { status: 200 } });
  api.removeFavorite.mockResolvedValue({ response: { status: 204 } });
});
afterEach(() => vi.unstubAllGlobals());
test("updates all consumers after removing and adding a favorite while preserving its rating", async () => {
  const first = useUserSelfRatings();
  await flushPromises();
  const second = useUserSelfRatings();
  await first.setFavorite("recipe", false);
  expect(second.userRatings.value[0]).toMatchObject({ rating: 4, isFavorite: false });
  await first.setFavorite("recipe", true);
  expect(second.userRatings.value[0]).toMatchObject({ rating: 4, isFavorite: true });
});
test("keeps a favorite visible when removal fails", async () => {
  const state = useUserSelfRatings();
  await flushPromises();
  api.removeFavorite.mockResolvedValueOnce({ response: { status: 500 } });
  expect(await state.setFavorite("recipe", false)).toBe(false);
  expect(state.userRatings.value[0].isFavorite).toBe(true);
});
