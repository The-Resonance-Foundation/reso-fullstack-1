import "server-only"

import type { ApplicantType } from "@/types/enums"

type SendResult = { sent: true } | { sent: false; reason: string }

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from =
    process.env.RESEND_FROM_EMAIL ?? "The Resonance Foundation <onboarding@resend.dev>"

  if (!apiKey) {
    return { sent: false, reason: "RESEND_API_KEY is not configured" }
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!response.ok) {
    const body = await response.text()
    return { sent: false, reason: body || response.statusText }
  }

  return { sent: true }
}

const TYPE_LABELS: Record<ApplicantType | "student", string> = {
  student: "student enrollment",
  tutor: "tutor application",
  officer: "officer application",
  volunteer: "volunteer application",
}

export async function sendApplicantRejectionEmail({
  to,
  fullName,
  applicantType,
  chapterName,
}: {
  to: string
  fullName: string
  applicantType: ApplicantType
  chapterName?: string | null
}): Promise<SendResult> {
  const typeLabel = TYPE_LABELS[applicantType]
  const chapterLine = chapterName
    ? `<p>Chapter: <strong>${chapterName}</strong></p>`
    : ""

  const html = `
    <p>Hi ${fullName},</p>
    <p>Thank you for your interest in The Resonance Foundation and for submitting your ${typeLabel}.</p>
    ${chapterLine}
    <p>After review, we are unable to move forward with your application at this time. We encourage you to apply again in a future semester or reach out if you have questions.</p>
    <p>With appreciation,<br/>The Resonance Foundation</p>
  `

  return sendEmail({
    to,
    subject: "Update on your Resonance Foundation application",
    html,
  })
}
