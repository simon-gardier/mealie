import { describe, expect, test, vi } from "vitest";
import { BaseCRUDAPI } from "./base-clients";
import type { ApiRequestInstance } from "~/lib/api/types/non-generated";

class LegacyClient extends BaseCRUDAPI<object, object> {
  override baseRoute = "/api/items";
  override itemRoute = (id: string | number) => `/api/items/${id}`;
}
class ConfiguredClient extends BaseCRUDAPI<object, object> {}

describe("CRUD route construction", () => {
  test("retains legacy request-only clients", async () => {
    const get = vi.fn().mockResolvedValue({ data: {} });
    const api = new LegacyClient({ get } as unknown as ApiRequestInstance);
    await api.getOne("one");
    expect(get).toHaveBeenCalledWith("/api/items/one", undefined, undefined);
  });
  test("uses constructor-supplied routes", async () => {
    const get = vi.fn().mockResolvedValue({ data: {} });
    const api = new ConfiguredClient({ get } as unknown as ApiRequestInstance, "/api/things", id => `/api/things/${id}`);
    await api.getOne(2);
    expect(get).toHaveBeenCalledWith("/api/things/2", undefined, undefined);
  });
  test("rejects a missing item route before sending a request", async () => {
    const get = vi.fn();
    const api = new ConfiguredClient({ get } as unknown as ApiRequestInstance);
    await expect(api.getOne(2)).rejects.toThrow("API client requires an item route");
    expect(get).not.toHaveBeenCalled();
  });
});
