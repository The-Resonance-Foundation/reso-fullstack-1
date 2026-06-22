import "server-only"

import { sendEmail } from "@/lib/email/applicant-rejection"

export async function sendSignupConfirmationEmail({
  to,
  fullName,
  confirmLink,
}: {
  to: string
  fullName: string
  confirmLink: string
}) {
  const html = `
    <p>Hi ${fullName},</p>
    <p>Thanks for signing up with The Resonance Foundation. Confirm your email to access the member portal:</p>
    <p><a href="${confirmLink}">Confirm my email</a></p>
    <p>If you did not create this account, you can ignore this email.</p>
    <p>With appreciation,<br/>The Resonance Foundation</p>
  `

  return sendEmail({
    to,
    subject: "Confirm your Resonance Foundation account",
    html,
  })
}
