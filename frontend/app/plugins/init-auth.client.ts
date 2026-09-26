import { watch } from "vue";

export default defineNuxtPlugin({
  async setup() {
    const auth = useAuthBackend();
    const { remember } = useRememberedAccounts();

    console.debug("Initializing auth plugin");
    // Must come first: it hydrates the token from the cookie, which getSession checks before it
    // will bother asking the server who we are.
    auth.initTokenRefresh();
    await auth.getSession();

    // Keeps the account picker's list up to date, for this login and any later one in this tab.
    watch(() => auth.data.value, (user) => {
      if (user) {
        remember(user);
      }
    }, { immediate: true });

    console.debug("Auth plugin initialized");
  },
});
