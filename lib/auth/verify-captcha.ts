import "server-only"

const SECRET = process.env.TURNSTILE_SECRET_KEY
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

/**
 * Verifies a Cloudflare Turnstile token for actions that send email via the
 * admin client (which GoTrue's own CAPTCHA enforcement does not cover). When
 * TURNSTILE_SECRET_KEY is not configured the check is disabled and passes, so
 * environments without CAPTCHA keys keep working.
 */
export async function verifyCaptchaToken(token: string | undefined) {
  if (!SECRET) return true
  if (!token) return false
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: SECRET, response: token }),
    })
    if (!res.ok) return false
    const data = (await res.json()) as { success?: boolean }
    return Boolean(data.success)
  } catch {
    return false
  }
}
