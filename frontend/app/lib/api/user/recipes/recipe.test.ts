import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { RecipeAPI } from "./recipe";
import type { ApiRequestInstance } from "~/lib/api/types/non-generated";

const streams = vi.hoisted(() => [] as any[]);
vi.mock("sse.js", () => ({
  SSE: class {
    static CLOSED = 2;
    listeners = new Map<string, (event: any) => void>();
    close = vi.fn();
    constructor(public url: string, public options: any) { streams.push(this); }
    addEventListener(name: string, listener: (event: any) => void) { this.listeners.set(name, listener); }
    stream() { expect(this.listeners.has("done")).toBe(true); }
    emit(name: string, event: any) { this.listeners.get(name)?.(event); }
  },
}));

describe("recipe creation stream", () => {
  beforeEach(() => {
    streams.length = 0;
    vi.stubGlobal("useMealieAuth", () => ({ token: ref("test-token") }));
    vi.stubGlobal("useGlobalI18n", () => ({ locale: ref("fr-FR") }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("registers listeners before connecting and accepts successful creation", async () => {
    const api = new RecipeAPI({} as ApiRequestInstance);
    const result = api.createOneByUrl("https://example.test/recipe", false, false);
    expect(streams[0].options.start).toBe(false);
    streams[0].emit("done", { data: JSON.stringify({ slug: "puff-pastry" }) });
    expect((await result).response?.status).toBe(201);
  });

  it("keeps HTTP authentication failures distinguishable from scrape failures", async () => {
    const result = new RecipeAPI({} as ApiRequestInstance).createOneByUrl("https://example.test/recipe", false, false);
    streams[0].emit("open", { responseCode: 401 });
    streams[0].emit("error", { data: JSON.stringify({ detail: "Not authenticated" }) });
    const response = await result;
    expect(response.error.status).toBe(401);
    expect(response.error.message).toBe("Not authenticated");
  });

  it("does not send legacy automatic organizer creation requests", async () => {
    const result = new RecipeAPI({} as ApiRequestInstance).createOneWithAI({ content: "Recipe", createNewOrganizers: true });
    expect((streams[0].options.payload as FormData).get("createNewOrganizers")).toBeNull();
    streams[0].emit("done", { data: JSON.stringify({ slug: "recipe" }) });
    expect((await result).data).toBe("recipe");
  });

  it("reports interrupted requests instead of waiting forever", async () => {
    const result = new RecipeAPI({} as ApiRequestInstance).createOneByUrl("https://example.test/recipe", false, false);
    streams[0].emit("readystatechange", { readyState: 2 });
    expect((await result).error).toBeInstanceOf(Error);
  });
});
