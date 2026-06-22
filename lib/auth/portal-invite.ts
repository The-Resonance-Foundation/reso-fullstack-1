import "server-only"

import { sendPortalInviteEmail } from "@/lib/email/portal-invite"
import { authCallbackUrl } from "@/lib/config/url"
import { createAdminClient } from "@/lib/supabase/admin"

type InviteParams = {
  email: string
  fullName: string
  phone: string | null
  chapterId: string
}

type InviteResult =
  | { ok: true; userId: string; emailed: boolean; warning?: string }
  | { ok: false; message: string }

const EXISTING_USER_PATTERNS = [
  "already been registered",
  "already registered",
  "user already exists",
]

function isExistingUserError(message: string) {
  const lower = message.toLowerCase()
  return EXISTING_USER_PATTERNS.some((pattern) => lower.includes(pattern))
}

export async function sendPortalInvite(params: InviteParams): Promise<InviteResult> {
  const admin = createAdminClient()
  const redirectTo = authCallbackUrl("/set-password")
  const userMetadata = {
    full_name: params.fullName,
    chapter_id: params.chapterId,
    phone: params.phone,
    signup_type: "invited",
  }

  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(params.email, {
      data: userMetadata,
      redirectTo,
    })

  if (!inviteError && inviteData.user) {
    return { ok: true, userId: inviteData.user.id, emailed: true }
  }

  if (!inviteError?.message || !isExistingUserError(inviteError.message)) {
    return {
      ok: false,
      message:
        inviteError?.message ?? "Could not invite user. They may already have an account.",
    }
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "invite",
    email: params.email,
    options: {
      data: userMetadata,
      redirectTo,
    },
  })

  if (linkError || !linkData.user) {
    return {
      ok: false,
      message: linkError?.message ?? inviteError.message,
    }
  }

  const actionLink = linkData.properties?.action_link
  if (!actionLink) {
    return { ok: false, message: "Invite link was not generated." }
  }

  const emailResult = await sendPortalInviteEmail({
    to: params.email,
    fullName: params.fullName,
    inviteLink: actionLink,
  })

  if (!emailResult.sent) {
    return {
      ok: true,
      userId: linkData.user.id,
      emailed: false,
      warning: `Invite link created but email was not sent (${emailResult.reason}).`,
    }
  }

  return { ok: true, userId: linkData.user.id, emailed: true }
}
