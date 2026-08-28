const PRODUCTION_URL = "https://theresonancefoundation.org"

/** True when a configured URL points at a local dev server. */
function isLocal(url: string | undefined): url is string {
  return Boolean(url && /localhost|127\.0\.0\.1/.test(url))
}

/** Base URL for auth redirects (invite links, callbacks). */
export function getAuthBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL

  if (process.env.NODE_ENV === "development") {
    if (isLocal(configured)) return configured
    return "http://localhost:3000"
  }

  // In production a missing or localhost value must never leak into emails
  // or redirects — fall back to the real domain.
  if (!configured || isLocal(configured)) return PRODUCTION_URL
  return configured
}

export function authCallbackUrl(next = "/set-password") {
  const base = getAuthBaseUrl()
  // Invites return tokens in the URL hash; /auth/confirm handles that client-side.
  return `${base}/auth/confirm?next=${encodeURIComponent(next)}`
}
