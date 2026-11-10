const INTERNAL_ORIGIN = "http://internal.invalid";

/**
 * Accepts only same-origin relative paths for post-auth redirects.
 * Anything else (absolute URLs, protocol-relative URLs, backslash or
 * control-character tricks) falls back to a known-safe path.
 */
export function safeRedirectPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 32 || code === 92 /* backslash */) return fallback;
  }
  try {
    const url = new URL(value, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) return fallback;
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}
