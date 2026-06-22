import "server-only"

import { authCallbackUrl } from "@/lib/config/url"
import { sendSignupConfirmationEmail } from "@/lib/email/signup-confirmation"
import { createAdminClient } from "@/lib/supabase/admin"

type DeliverResult =
  | { ok: true }
  | { ok: false; message: string }

/**
 * Sends signup confirmation via Resend (not Supabase SMTP).
 * Uses a magic link that confirms the email and signs the user in.
 */
export async function deliverSignupConfirmationEmail({
  email,
  fullName,
}: {
  email: string
  fullName: string
}): Promise<DeliverResult> {
  const admin = createAdminClient()
  const redirectTo = authCallbackUrl("/dashboard")

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  })

  const confirmLink = linkData?.properties?.action_link
  if (linkError || !confirmLink) {
    return {
      ok: false,
      message: linkError?.message ?? "Could not generate a confirmation link.",
    }
  }

  const emailResult = await sendSignupConfirmationEmail({
    to: email,
    fullName,
    confirmLink,
  })

  if (!emailResult.sent) {
    return {
      ok: false,
      message: emailResult.reason,
    }
  }

  return { ok: true }
}
