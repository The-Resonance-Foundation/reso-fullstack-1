import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

/** Test accounts use a fake domain — never hand those to Resend. */
export function isDeliverable(email: string | null | undefined): email is string {
  return Boolean(email && !email.toLowerCase().endsWith("@resonance.test"))
}

/**
 * Every portal email goes to the address on file AND to the member's personal
 * notification address when they have set one. Callers keep addressing people
 * by their account email; this expands that list right before the send, so a
 * new email sender never has to remember the rule.
 *
 * Failures are swallowed: a lookup problem must degrade to "delivered to the
 * account email only", never to a dropped notification.
 */
export async function expandRecipients(
  emails: (string | null | undefined)[]
): Promise<string[]> {
  const primary = [...new Set(emails.filter(isDeliverable).map((e) => e.trim()))]
  if (primary.length === 0) return []

  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("profiles")
      .select("email, notification_email")
      .not("notification_email", "is", null)
      .in("email", primary)

    const extras = (data ?? [])
      .map((row) => row.notification_email)
      .filter(isDeliverable)

    return [...new Set([...primary, ...extras])]
  } catch (error) {
    console.error("expandRecipients", error)
    return primary
  }
}
