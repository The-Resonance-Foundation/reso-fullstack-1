import "server-only"

import { authCallbackUrl } from "@/lib/config/url"
import { sendPasswordResetEmail } from "@/lib/email/password-reset"
import { createAdminClient } from "@/lib/supabase/admin"

type DeliverResult =
  | { ok: true }
  | { ok: false; message: string; userMissing?: boolean }

/**
 * Sends password reset via Resend (not Supabase SMTP).
 * Uses a recovery link that signs the user in and routes to set-password.
 */
export async function deliverPasswordResetEmail({
  email,
  fullName,
}: {
  email: string
  fullName: string
}): Promise<DeliverResult> {
  const admin = createAdminClient()
  const redirectTo = authCallbackUrl("/set-password")

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  })

  const resetLink = linkData?.properties?.action_link
  if (linkError || !resetLink) {
    const lower = linkError?.message?.toLowerCase() ?? ""
    if (lower.includes("not found") || lower.includes("no user")) {
      return { ok: false, message: linkError?.message ?? "User not found.", userMissing: true }
    }
    return {
      ok: false,
      message: linkError?.message ?? "Could not generate a reset link.",
    }
  }

  const emailResult = await sendPasswordResetEmail({
    to: email,
    fullName,
    resetLink,
  })

  if (!emailResult.sent) {
    return {
      ok: false,
      message: emailResult.reason,
    }
  }

  return { ok: true }
}
