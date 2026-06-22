import "server-only"

import { sendEmail } from "@/lib/email/applicant-rejection"

export async function sendStudentRejectionEmail({
  to,
  studentName,
  chapterName,
}: {
  to: string
  studentName: string
  chapterName?: string | null
}) {
  const chapterLine = chapterName
    ? `<p>Chapter: <strong>${chapterName}</strong></p>`
    : ""

  const html = `
    <p>Hello,</p>
    <p>Thank you for enrolling <strong>${studentName}</strong> with The Resonance Foundation.</p>
    ${chapterLine}
    <p>After review, we are unable to approve this enrollment at this time. If you have questions or would like to discuss next steps, please reply to this email or contact your chapter.</p>
    <p>With appreciation,<br/>The Resonance Foundation</p>
  `

  return sendEmail({
    to,
    subject: "Update on your Resonance Foundation enrollment",
    html,
  })
}
