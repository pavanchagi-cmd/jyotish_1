/**
 * Only allow same-site relative paths as post-login redirects, to avoid
 * open redirects such as `?next=https://evil.example` or `?next=//evil.example`.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
