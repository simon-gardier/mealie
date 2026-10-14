import { describe, expect, test } from "vitest";
import { isSafeRedirectTarget } from "./redirect";

describe("isSafeRedirectTarget", () => {
  test("accepts an internal path", () => {
    expect(isSafeRedirectTarget("/g/home/r/some-recipe")).toBe(true);
  });

  test("rejects protocol-relative URLs", () => {
    expect(isSafeRedirectTarget("//evil.com")).toBe(false);
  });

  test("rejects backslash variants used to bypass same-origin checks", () => {
    expect(isSafeRedirectTarget("/\\evil.com")).toBe(false);
    expect(isSafeRedirectTarget("\\\\evil.com")).toBe(false);
  });

  test("rejects absolute URLs", () => {
    expect(isSafeRedirectTarget("https://evil.com")).toBe(false);
  });

  test.each(["/\t/evil.com", "/\n/evil.com", "/%2fevil.com", "/%5cevil.com", "/foo\\bar"])("rejects normalized or encoded separators: %s", (target) => {
    expect(isSafeRedirectTarget(target)).toBe(false);
  });

  test("keeps internal query parameters and fragments", () => {
    expect(isSafeRedirectTarget("/recipes?url=https%3A%2F%2Fexample.com#ingredients")).toBe(true);
  });

  test("rejects empty or missing values", () => {
    expect(isSafeRedirectTarget("")).toBe(false);
    expect(isSafeRedirectTarget(null)).toBe(false);
    expect(isSafeRedirectTarget(undefined)).toBe(false);
  });
});
