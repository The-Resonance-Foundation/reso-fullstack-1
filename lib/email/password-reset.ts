import "server-only"

import { sendEmail } from "@/lib/email/applicant-rejection"

export async function sendPasswordResetEmail({
  to,
  fullName,
  resetLink,
}: {
  to: string
  fullName: string
  resetLink: string
}) {
  const html = `
    <p>Hi ${fullName},</p>
    <p>We received a request to reset your password for The Resonance Foundation member portal.</p>
    <p><a href="${resetLink}">Reset my password</a></p>
    <p>This link expires after a short time. If you did not request a reset, you can ignore this email.</p>
    <p>With appreciation,<br/>The Resonance Foundation</p>
  `

  return sendEmail({
    to,
    subject: "Reset your Resonance Foundation password",
    html,
  })
}
