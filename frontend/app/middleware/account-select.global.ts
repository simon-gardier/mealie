import { isSafeRedirectTarget } from "~/lib/validators/redirect";

/** Routes where the picker would get in the way: auth flows, public pages, and the picker itself. */
const SKIPPED_PREFIXES = [
  "/login",
  "/logout",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/account-select",
  "/admin/setup",
  "/explore",
];

/** Publicly shared recipes: /g/{groupSlug}/shared/... */
const SHARED_RECIPE_PATH = /^\/g\/[^/]+\/shared(\/|$)/;

function isSkipped(path: string) {
  return SHARED_RECIPE_PATH.test(path)
    || SKIPPED_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
}

/**
 * Sends a returning, still-authenticated visitor through the account picker before letting them
 * back into the app. Only runs once per browser session.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) {
    return;
  }

  const accountSelected = useAccountSelected();
  if (accountSelected.value || isSkipped(to.path)) {
    return;
  }

  const { loggedIn } = useMealieAuth();
  if (!loggedIn.value) {
    return;
  }

  // "/" resolves the landing route itself, so there is nothing worth carrying over.
  const redirect = to.path !== "/" && isSafeRedirectTarget(to.fullPath) ? to.fullPath : "";
  return navigateTo(redirect
    ? `/account-select?redirect=${encodeURIComponent(redirect)}`
    : "/account-select");
});
