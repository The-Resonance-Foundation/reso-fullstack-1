import "server-only"

import { sendEmail } from "@/lib/email/applicant-rejection"
import { expandRecipients, isDeliverable as deliverable } from "@/lib/email/recipients"
import { getAuthBaseUrl } from "@/lib/config/url"

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

const BCC_CHUNK = 40

async function sendBccBatch({
  bcc,
  subject,
  html,
}: {
  bcc: string[]
  subject: string
  html: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  const from =
    process.env.RESEND_FROM_EMAIL ?? "The Resonance Foundation <onboarding@resend.dev>"
  if (!apiKey) return
  // Resend requires a `to`; the from-address serves as the visible recipient
  // while everyone real rides in bcc.
  const toSelf = from.match(/<([^>]+)>/)?.[1] ?? from
  for (let i = 0; i < bcc.length; i += BCC_CHUNK) {
    const chunk = bcc.slice(i, i + BCC_CHUNK)
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: toSelf, bcc: chunk, subject, html }),
    })
    if (!response.ok) {
      console.error("sendBccBatch", await response.text())
    }
  }
}

/** Immediate email for a new portal message. Never throws. */
export async function emailMessageNotification({
  recipients,
  senderName,
  preview,
  conversationId,
}: {
  recipients: { email: string | null; name: string | null }[]
  senderName: string
  preview: string
  conversationId: string
}) {
  try {
    const link = `${getAuthBaseUrl()}/dashboard/messages/${conversationId}`
    const safePreview = escapeHtml(preview.slice(0, 160))
    await Promise.all(
      recipients.filter((r) => deliverable(r.email)).map((r) =>
        sendEmail({
          to: r.email as string,
          subject: `New message from ${senderName}`,
          html: `
            <p>Hi ${escapeHtml(r.name ?? "there")},</p>
            <p><strong>${escapeHtml(senderName)}</strong> sent you a message in the Resonance portal:</p>
            <blockquote style="margin:12px 0;padding:8px 12px;border-left:3px solid #7c2d3e;color:#444;">${safePreview}</blockquote>
            <p><a href="${link}">Open the conversation</a> to read and reply.</p>
            <p>— The Resonance Foundation</p>
          `,
        })
      )
    )
  } catch (error) {
    console.error("emailMessageNotification", error)
  }
}

/** Immediate email for a published announcement. Never throws. */
export async function emailAnnouncementNotification({
  emails,
  title,
  body,
  scopeName,
}: {
  emails: (string | null)[]
  title: string
  body: string
  scopeName: string
}) {
  try {
    const link = `${getAuthBaseUrl()}/dashboard/announcements`
    // Personal notification addresses ride along in the same bcc batch.
    const bcc = await expandRecipients(emails)
    if (!bcc.length) return
    await sendBccBatch({
      bcc,
      subject: `${scopeName} announcement: ${title}`,
      html: `
        <p><strong>${escapeHtml(title)}</strong></p>
        <p style="white-space:pre-line;">${escapeHtml(body)}</p>
        <p><a href="${link}">View announcements in the portal</a></p>
        <p>— The Resonance Foundation</p>
      `,
    })
  } catch (error) {
    console.error("emailAnnouncementNotification", error)
  }
}
