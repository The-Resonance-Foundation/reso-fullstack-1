import "server-only"

import { SITE_URL, button, deliver } from "@/lib/email/lifecycle"

/**
 * Scheduled and situational reminder emails: event reminders, lesson
 * reminders, reviewer digests, practice nudges and milestones, and lesson
 * cancellations. Same contract as lifecycle.ts: fire-and-forget, test
 * addresses skipped, failures logged rather than thrown.
 */

const EVENT_TIME = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  weekday: "long",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

export function formatEventTime(iso: string) {
  return EVENT_TIME.format(new Date(iso))
}

/** Sent the day before an event to everyone who RSVP'd going or maybe. */
export async function sendEventReminderEmail({
  to,
  title,
  startsAt,
  location,
}: {
  to: string | null | undefined
  title: string
  startsAt: string
  location?: string | null
}) {
  const where = location ? `<p>Where: <strong>${location}</strong></p>` : ""
  await deliver(
    to,
    `Reminder: ${title} is tomorrow`,
    `
    <p>Hello,</p>
    <p>A friendly reminder that <strong>${title}</strong> is tomorrow.</p>
    <p>When: <strong>${formatEventTime(startsAt)}</strong></p>
    ${where}
    <p>If your plans changed, please update your RSVP so organizers can plan accurately.</p>
    ${button(`${SITE_URL}/dashboard/events`, "View the event")}
    <p>See you there,<br/>The Resonance Foundation</p>
  `
  )
}

/** Sent the morning of a scheduled lesson to the tutor and the family. */
export async function sendLessonReminderEmails({
  tutorEmail,
  tutorName,
  parentEmail,
  studentName,
  scheduledStart,
  location,
}: {
  tutorEmail: string | null | undefined
  tutorName: string
  parentEmail: string | null | undefined
  studentName: string
  scheduledStart: string
  location?: string | null
}) {
  const when = formatEventTime(scheduledStart)
  const where = location ? `<p>Where: <strong>${location}</strong></p>` : ""
  await Promise.all([
    deliver(
      tutorEmail,
      `Lesson today: ${studentName} at ${when.split(" at ")[1] ?? when}`,
      `
      <p>Hi ${tutorName},</p>
      <p>You have a lesson with <strong>${studentName}</strong> today.</p>
      <p>When: <strong>${when}</strong></p>
      ${where}
      ${button(`${SITE_URL}/dashboard/lessons`, "Open lessons")}
      <p>Happy teaching,<br/>The Resonance Foundation</p>
    `
    ),
    deliver(
      parentEmail,
      `Lesson today for ${studentName}`,
      `
      <p>Hello,</p>
      <p><strong>${studentName}</strong> has a lesson today with ${tutorName}.</p>
      <p>When: <strong>${when}</strong></p>
      ${where}
      ${button(`${SITE_URL}/dashboard/lessons`, "Open lessons")}
      <p>Happy playing,<br/>The Resonance Foundation</p>
    `
    ),
  ])
}

/** Every-three-days summary of pending review work, per reviewer. */
export async function sendReviewerDigestEmail({
  to,
  fullName,
  applicants,
  students,
  hours,
  scopeLabel,
}: {
  to: string | null | undefined
  fullName: string
  applicants: number
  students: number
  hours: number
  scopeLabel: string
}) {
  const rows = [
    applicants > 0
      ? `<li><strong>${applicants}</strong> application${applicants === 1 ? "" : "s"} awaiting review</li>`
      : "",
    students > 0
      ? `<li><strong>${students}</strong> student registration${students === 1 ? "" : "s"} awaiting approval</li>`
      : "",
    hours > 0
      ? `<li><strong>${hours}</strong> volunteer hour entr${hours === 1 ? "y" : "ies"} awaiting approval</li>`
      : "",
  ].join("")
  await deliver(
    to,
    "Pending work in the Resonance portal",
    `
    <p>Hi ${fullName},</p>
    <p>A quick summary of what is waiting on a reviewer ${scopeLabel}:</p>
    <ul>${rows}</ul>
    <p>People are usually waiting on the other side of these, so a few minutes here goes a long way.</p>
    ${button(`${SITE_URL}/dashboard`, "Open the portal")}
    <p>Thank you,<br/>The Resonance Foundation</p>
  `
  )
}

/** Weekly gentle nudge to families whose students have not logged practice. */
export async function sendPracticeNudgeEmail({
  to,
  studentNames,
}: {
  to: string | null | undefined
  studentNames: string[]
}) {
  const who =
    studentNames.length === 1
      ? `<strong>${studentNames[0]}</strong> has`
      : `<strong>${studentNames.join(" and ")}</strong> have`
  await deliver(
    to,
    "A little practice goes a long way",
    `
    <p>Hello,</p>
    <p>Just a friendly note: ${who} not logged any practice this week. Even ten minutes counts, and tutors use the log to shape the next lesson.</p>
    <p>No pressure, and no judgment. Music should stay fun.</p>
    ${button(`${SITE_URL}/dashboard/practice`, "Log practice")}
    <p>Keep playing,<br/>The Resonance Foundation</p>
  `
  )
}

/** Congratulations when a student hits a practice streak milestone. */
export async function sendPracticeMilestoneEmail({
  to,
  studentName,
  streak,
}: {
  to: string | null | undefined
  studentName: string
  streak: number
}) {
  await deliver(
    to,
    `${studentName} just hit a ${streak} day practice streak!`,
    `
    <p>Hello,</p>
    <p>Something worth celebrating: <strong>${studentName}</strong> has now practiced <strong>${streak} days in a row</strong>.</p>
    <p>Consistency is the whole secret to learning an instrument, and this is what it looks like. Tell them we are proud of them.</p>
    ${button(`${SITE_URL}/dashboard/practice`, "See the streak")}
    <p>Keep it going,<br/>The Resonance Foundation</p>
  `
  )
}

/** A scheduled lesson was cancelled: tell both sides. */
export async function sendLessonCancelledEmails({
  tutorEmail,
  tutorName,
  parentEmail,
  studentName,
  scheduledStart,
}: {
  tutorEmail: string | null | undefined
  tutorName: string
  parentEmail: string | null | undefined
  studentName: string
  scheduledStart: string
}) {
  const when = formatEventTime(scheduledStart)
  const html = (greeting: string) => `
    <p>${greeting},</p>
    <p>The lesson for <strong>${studentName}</strong> scheduled for <strong>${when}</strong> has been <strong>cancelled</strong>.</p>
    <p>You can request or schedule a replacement time from the portal, or message the other side to rearrange.</p>
    ${button(`${SITE_URL}/dashboard/lessons`, "Open lessons")}
    <p>The Resonance Foundation</p>
  `
  await Promise.all([
    deliver(tutorEmail, `Lesson cancelled: ${studentName}, ${when}`, html(`Hi ${tutorName}`)),
    deliver(parentEmail, `Lesson cancelled for ${studentName}`, html("Hello")),
  ])
}
