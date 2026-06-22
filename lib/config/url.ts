/** Base URL for auth redirects (invite links, callbacks). */
export function getAuthBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL

  if (process.env.NODE_ENV === "development") {
    if (configured?.includes("localhost")) return configured
    return "http://localhost:3000"
  }

  return configured ?? "http://localhost:3000"
}

export function authCallbackUrl(next = "/set-password") {
  const base = getAuthBaseUrl()
  // Invites return tokens in the URL hash; /auth/confirm handles that client-side.
  return `${base}/auth/confirm?next=${encodeURIComponent(next)}`
}
