import "server-only"

import { sendEmail } from "@/lib/email/applicant-rejection"
import type { ApplicantType } from "@/types/enums"

/**
 * Good-news and lifecycle emails: acceptances, approvals, role grants,
 * tutor matches, and reviewer alerts. Every sender here is fire-and-forget:
 * it skips test addresses, never throws, and logs failures instead of
 * breaking the action that triggered it.
 */

// Emails always link to the real site: a missing or localhost
// NEXT_PUBLIC_SITE_URL must never end up in someone's inbox.
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
export const SITE_URL =
  !configuredSiteUrl || /localhost|127\.0\.0\.1/.test(configuredSiteUrl)
    ? "https://theresonancefoundation.org"
    : configuredSiteUrl

export function deliverable(email: string | null | undefined): email is string {
  return Boolean(email && !email.endsWith("@resonance.test"))
}

export async function deliver(to: string | null | undefined, subject: string, html: string) {
  if (!deliverable(to)) return
  try {
    const result = await sendEmail({ to, subject, html })
    if (!result.sent) console.error(`email "${subject}" to ${to}: ${result.reason}`)
  } catch (error) {
    console.error(`email "${subject}" to ${to}`, error)
  }
}

export function button(href: string, label: string) {
  return `<p><a href="${href}" style="display:inline-block;background:#2A397B;color:#FDFCF9;text-decoration:none;border-radius:8px;padding:10px 22px;font-weight:600">${label}</a></p>`
}

const TYPE_LABELS: Record<ApplicantType, string> = {
  tutor: "tutor",
  officer: "officer",
  volunteer: "volunteer",
}

/** Applicant accepted: their role is live the next time they sign in. */
export async function sendApplicantAcceptanceEmail({
  to,
  fullName,
  applicantType,
  positionLabel,
  chapterName,
}: {
  to: string
  fullName: string
  applicantType: ApplicantType
  /** Specific position (e.g. "Chapter President") when finer than the type. */
  positionLabel?: string | null
  chapterName?: string | null
}) {
  const where = chapterName ? ` with the ${chapterName} chapter` : ""
  const what = (positionLabel ?? TYPE_LABELS[applicantType]).toLowerCase()
  await deliver(
    to,
    "Welcome aboard - your Resonance Foundation application was accepted",
    `
    <p>Hi ${fullName},</p>
    <p>Great news: your ${what} application${where} has been <strong>accepted</strong>.</p>
    <p>Your new role is already active. Sign in to the portal to get started - your tools are waiting in the sidebar.</p>
    ${button(`${SITE_URL}/login`, "Open the portal")}
    <p>Welcome to the team,<br/>The Resonance Foundation</p>
  `
  )
}

/** Student registration approved: the family can start requesting lessons. */
export async function sendStudentApprovalEmail({
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
  await deliver(
    to,
    `${studentName} is approved - lessons can begin`,
    `
    <p>Hello,</p>
    <p><strong>${studentName}</strong> has been approved and is ready to start. Every lesson is completely free.</p>
    ${chapterLine}
    <p>Sign in and open the Lessons page to request a time from your tutor's availability.</p>
    ${button(`${SITE_URL}/dashboard/lessons`, "Request a lesson")}
    <p>Happy playing,<br/>The Resonance Foundation</p>
  `
  )
}

/** Volunteer hours approved and the certificate is ready to download. */
export async function sendHoursApprovedEmail({
  to,
  fullName,
  totalHours,
}: {
  to: string | null | undefined
  fullName: string
  totalHours: number
}) {
  await deliver(
    to,
    "Your volunteer hours were approved - certificate ready",
    `
    <p>Hi ${fullName},</p>
    <p>Your <strong>${totalHours.toFixed(2)} volunteer hours</strong> have been approved, and your official Certificate of Volunteer Service is ready.</p>
    <p>You can preview or download it any time from the Certificates page.</p>
    ${button(`${SITE_URL}/dashboard/volunteer/certificates`, "View your certificate")}
    <p>Thank you for your service,<br/>The Resonance Foundation</p>
  `
  )
}

/** Volunteer hours rejected, with the reviewer's reason. */
export async function sendHoursRejectedEmail({
  to,
  fullName,
  hours,
  activityDate,
  reason,
}: {
  to: string | null | undefined
  fullName: string
  hours: number
  activityDate: string
  reason?: string | null
}) {
  const reasonLine = reason
    ? `<p>Reviewer's note: <em>${reason}</em></p>`
    : ""
  await deliver(
    to,
    "Update on your logged volunteer hours",
    `
    <p>Hi ${fullName},</p>
    <p>Your volunteer hours entry (<strong>${hours} hours on ${activityDate}</strong>) was not approved.</p>
    ${reasonLine}
    <p>You are welcome to correct the details and log the entry again from the portal.</p>
    ${button(`${SITE_URL}/dashboard/volunteer/hours`, "Log hours")}
    <p>With appreciation,<br/>The Resonance Foundation</p>
  `
  )
}

/** A role was granted directly from the Roles page. */
export async function sendRoleGrantedEmail({
  to,
  fullName,
  roleLabel,
  chapterName,
}: {
  to: string | null | undefined
  fullName: string
  roleLabel: string
  chapterName?: string | null
}) {
  const where = chapterName ? ` for the ${chapterName} chapter` : ""
  await deliver(
    to,
    `You are now a ${roleLabel} at The Resonance Foundation`,
    `
    <p>Hi ${fullName},</p>
    <p>You have been granted the <strong>${roleLabel}</strong> role${where}.</p>
    <p>The tools that come with it are already in your portal sidebar the next time you sign in.</p>
    ${button(`${SITE_URL}/login`, "Open the portal")}
    <p>Welcome,<br/>The Resonance Foundation</p>
  `
  )
}

/** A tutor and student were matched: tell both sides. */
export async function sendTutorAssignmentEmails({
  tutorEmail,
  tutorName,
  parentEmail,
  studentName,
  chapterName,
}: {
  tutorEmail: string | null | undefined
  tutorName: string
  parentEmail: string | null | undefined
  studentName: string
  chapterName?: string | null
}) {
  const where = chapterName ? ` (${chapterName} chapter)` : ""
  await Promise.all([
    deliver(
      tutorEmail,
      `New student assigned: ${studentName}`,
      `
      <p>Hi ${tutorName},</p>
      <p>You have been assigned a new student: <strong>${studentName}</strong>${where}.</p>
      <p>Open their hub to see their instrument and level, and make sure your availability is current so the family can request a first lesson. A message thread with the family has been opened for you.</p>
      ${button(`${SITE_URL}/dashboard/tutor/students`, "Open My Students")}
      <p>Happy teaching,<br/>The Resonance Foundation</p>
    `
    ),
    deliver(
      parentEmail,
      `${studentName} has been matched with a tutor`,
      `
      <p>Hello,</p>
      <p><strong>${studentName}</strong> has been matched with their tutor, <strong>${tutorName}</strong>${where}.</p>
      <p>You can now request a lesson from the tutor's weekly availability, and message them directly in the portal.</p>
      ${button(`${SITE_URL}/dashboard/lessons`, "Request a lesson")}
      <p>Happy playing,<br/>The Resonance Foundation</p>
    `
    ),
  ])
}

/** A new staff application arrived: alert the reviewers with authority. */
export async function sendNewApplicationAlertEmails({
  reviewerEmails,
  applicantName,
  applicantType,
  positionLabel,
  chapterName,
}: {
  reviewerEmails: (string | null)[]
  applicantName: string
  applicantType: ApplicantType
  /** Specific position (e.g. "Chapter President") when finer than the type. */
  positionLabel?: string | null
  chapterName?: string | null
}) {
  const where = chapterName ? ` for the ${chapterName} chapter` : ""
  const what = (positionLabel ?? TYPE_LABELS[applicantType]).toLowerCase()
  const unique = [...new Set(reviewerEmails.filter(deliverable))]
  await Promise.all(
    unique.map((to) =>
      deliver(
        to,
        `New ${what} application to review`,
        `
        <p>Hello,</p>
        <p><strong>${applicantName}</strong> just applied as a ${what}${where} and is waiting for review.</p>
        ${button(`${SITE_URL}/dashboard/applicants`, "Review the application")}
        <p>The Resonance Foundation</p>
      `
      )
    )
  )
}
