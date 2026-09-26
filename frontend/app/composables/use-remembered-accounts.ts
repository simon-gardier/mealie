import { useLocalStorage, useSessionStorage } from "@vueuse/core";
import type { UserOut } from "~/lib/api/types/user";

export interface RememberedAccount {
  id: string;
  username: string;
  fullName: string;
  groupSlug: string;
  lastSeen: number;
}

const ACCOUNTS_KEY = "mealie-remembered-accounts";
const SELECTED_KEY = "mealie-account-selected";
const MAX_ACCOUNTS = 8;

/**
 * Accounts that have signed in on this browser before.
 *
 * Only display data is kept - no tokens - so picking a different account still goes through the
 * regular login form. This is deliberately frontend-only and requires no backend support.
 */
export function useRememberedAccounts() {
  const accounts = useLocalStorage<RememberedAccount[]>(ACCOUNTS_KEY, []);

  function remember(user: UserOut) {
    if (!user?.id || !user.username) {
      return;
    }

    const entry: RememberedAccount = {
      id: user.id,
      username: user.username,
      fullName: user.fullName || user.username,
      groupSlug: user.groupSlug || "",
      lastSeen: Date.now(),
    };

    accounts.value = [entry, ...accounts.value.filter(account => account.id !== entry.id)]
      .slice(0, MAX_ACCOUNTS);
  }

  function forget(id: string) {
    accounts.value = accounts.value.filter(account => account.id !== id);
  }

  return { accounts, remember, forget };
}

/**
 * Whether the account picker has already been answered in this browser session. Using session
 * storage means a returning visitor (new tab, new day) sees the picker again, while navigating
 * around the app does not.
 */
export function useAccountSelected() {
  return useSessionStorage<boolean>(SELECTED_KEY, false);
}
