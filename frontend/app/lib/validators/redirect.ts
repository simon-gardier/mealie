// rejects protocol-relative payloads (`//evil.com`, `/\evil.com`) that a bare startsWith("/") check would miss
export function isSafeRedirectTarget(target: string | null | undefined): target is string {
  if (typeof target !== "string" || !target.startsWith("/") || target.includes("\\")) {
    return false;
  }
  if (Array.from(target).some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)) {
    return false;
  }

  // Browsers strip tabs/newlines when parsing URLs. Validate the parsed origin too,
  // and reject encoded leading separators that a router could decode later.
  const origin = "https://petit-chef.invalid";
  return !/^\/(?:\/|%(?:2f|5c))/i.test(target) && new URL(target, origin).origin === origin;
}
