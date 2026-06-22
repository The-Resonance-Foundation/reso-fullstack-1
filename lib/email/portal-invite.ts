import "server-only"

import { sendEmail } from "@/lib/email/applicant-rejection"

export async function sendPortalInviteEmail({
  to,
  fullName,
  inviteLink,
}: {
  to: string
  fullName: string
  inviteLink: string
}) {
  const html = `
    <p>Hi ${fullName},</p>
    <p>You have been invited to The Resonance Foundation member portal. Use the link below to set your password and sign in:</p>
    <p><a href="${inviteLink}">Complete your account setup</a></p>
    <p>If you did not expect this email, you can ignore it.</p>
    <p>With appreciation,<br/>The Resonance Foundation</p>
  `

  return sendEmail({
    to,
    subject: "Your Resonance Foundation portal invitation",
    html,
  })
}
