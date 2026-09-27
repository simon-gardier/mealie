import { useLocalStorage } from "@vueuse/core";
import type { UserOut } from "~/lib/api/types/user";

export interface RememberedAccount {
  id: string;
  username: string;
  fullName: string;
  groupSlug: string;
  lastSeen: number;
}

const ACCOUNTS_KEY = "mealie-remembered-accounts";
const SELECTED_KEY = "mealie-account-selected-on";
const MAX_ACCOUNTS = 8;

/** Local calendar day, so the picker comes back the next time the user visits on a new day. */
function today() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

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
 * Whether the account picker has already been answered today. Stamping the day in local storage
 * means new tabs and app restarts don't re-prompt, but a visitor returning on another day does
 * see the picker again.
 */
export function useAccountSelected() {
  const selectedOn = useLocalStorage<string>(SELECTED_KEY, "");

  return computed<boolean>({
    get: () => selectedOn.value === today(),
    set: (value) => {
      selectedOn.value = value ? today() : "";
    },
  });
}
