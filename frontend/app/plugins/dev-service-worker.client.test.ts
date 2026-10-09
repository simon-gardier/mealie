import { describe, expect, test, vi } from "vitest";
import { unregisterDevWorker } from "./dev-service-worker.client";

function registration(scope: string, scriptURL: string) {
  const unregister = vi.fn(async () => true);
  return { scope, active: { scriptURL }, unregister } as unknown as ServiceWorkerRegistration & { unregister: typeof unregister };
}

describe("stale development service workers", () => {
  test("unregisters the app worker without touching other workers or scopes", async () => {
    const app = registration("http://localhost:3000/", "http://localhost:3000/sw.js");
    const other = registration("http://localhost:3000/other/", "http://localhost:3000/other/sw.js");
    const unrelated = registration("http://localhost:3000/", "http://localhost:3000/unrelated.js");
    await unregisterDevWorker(new URL("http://localhost:3000/"), { getRegistrations: async () => [app, other, unrelated] });
    expect(app.unregister).toHaveBeenCalledOnce();
    expect(other.unregister).not.toHaveBeenCalled();
    expect(unrelated.unregister).not.toHaveBeenCalled();
  });

  test("handles apps hosted under a subpath", async () => {
    const app = registration("http://localhost:3000/chef/", "http://localhost:3000/chef/sw.js");
    await unregisterDevWorker(new URL("http://localhost:3000/chef/"), { getRegistrations: async () => [app] });
    expect(app.unregister).toHaveBeenCalledOnce();
  });
});
