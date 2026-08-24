import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  sendEventReminderEmail,
  sendLessonReminderEmails,
  sendPracticeNudgeEmail,
  sendReviewerDigestEmail,
} from "@/lib/email/reminders"

export const dynamic = "force-dynamic"

/**
 * Daily notification cron (Vercel Cron, ~13:00 UTC / morning in DFW):
 * - event reminders for tomorrow's events, to everyone RSVP'd going/maybe
 * - lesson reminders for today's scheduled lessons, to tutor and family
 * - reviewer digest of pending work, every 3 days
 * - practice nudge to quiet families, Mondays only
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const summary = {
    eventReminders: 0,
    lessonReminders: 0,
    reviewerDigests: 0,
    practiceNudges: 0,
  }

  const emailByUser = async (userIds: string[]) => {
    if (!userIds.length) return new Map<string, { full_name: string | null; email: string | null }>()
    const { data } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", [...new Set(userIds)])
    return new Map((data ?? []).map((p) => [p.id, p]))
  }

  // ---------------------------------------------------------------------
  // 1. Event reminders: events starting 20h-44h from now (i.e. tomorrow)
  // ---------------------------------------------------------------------
  try {
    const from = new Date(now.getTime() + 20 * 36e5).toISOString()
    const to = new Date(now.getTime() + 44 * 36e5).toISOString()
    const { data: events } = await admin
      .from("events")
      .select("id, title, starts_at, location")
      .eq("status", "published")
      .gte("starts_at", from)
      .lt("starts_at", to)
    for (const event of events ?? []) {
      const { data: rsvps } = await admin
        .from("event_rsvps")
        .select("user_id, status")
        .eq("event_id", event.id)
        .in("status", ["going", "maybe"])
      const profiles = await emailByUser((rsvps ?? []).map((r) => r.user_id))
      for (const rsvp of rsvps ?? []) {
        await sendEventReminderEmail({
          to: profiles.get(rsvp.user_id)?.email,
          title: event.title,
          startsAt: event.starts_at,
          location: event.location,
        })
        summary.eventReminders++
      }
    }
  } catch (error) {
    console.error("cron event reminders", error)
  }

  // ---------------------------------------------------------------------
  // 2. Lesson reminders: scheduled lessons in the next 16 hours
  // ---------------------------------------------------------------------
  try {
    const to = new Date(now.getTime() + 16 * 36e5).toISOString()
    const { data: lessons } = await admin
      .from("lessons")
      .select("id, tutor_user_id, student_id, scheduled_start, location")
      .eq("status", "scheduled")
      .gte("scheduled_start", now.toISOString())
      .lt("scheduled_start", to)
    for (const lesson of lessons ?? []) {
      const { data: student } = await admin
        .from("students")
        .select("first_name, last_name, parent_user_id")
        .eq("id", lesson.student_id)
        .maybeSingle()
      if (!student) continue
      const profiles = await emailByUser([lesson.tutor_user_id, student.parent_user_id])
      await sendLessonReminderEmails({
        tutorEmail: profiles.get(lesson.tutor_user_id)?.email,
        tutorName: profiles.get(lesson.tutor_user_id)?.full_name ?? "your tutor",
        parentEmail: profiles.get(student.parent_user_id)?.email,
        studentName: `${student.first_name} ${student.last_name}`,
        scheduledStart: lesson.scheduled_start,
        location: lesson.location,
      })
      summary.lessonReminders++
    }
  } catch (error) {
    console.error("cron lesson reminders", error)
  }

  // ---------------------------------------------------------------------
  // 3. Reviewer digest, every third day
  // ---------------------------------------------------------------------
  try {
    if (Math.floor(now.getTime() / 86_400_000) % 3 === 0) {
      const [{ data: applicants }, { data: students }, { data: hours }, { data: reviewers }] =
        await Promise.all([
          admin.from("applicants").select("chapter_id").eq("stage", "applied"),
          admin.from("students").select("chapter_id").eq("status", "pending"),
          admin.from("volunteer_hours").select("chapter_id").eq("status", "pending"),
          admin
            .from("user_roles")
            .select("user_id, role, chapter_id")
            .eq("status", "active")
            .in("role", [
              "board_of_director",
              "program_administrator",
              "chapter_president",
              "chapter_officer",
            ]),
        ])

      const countFor = (rows: { chapter_id: string | null }[] | null, chapterIds: string[] | null) =>
        (rows ?? []).filter((r) =>
          chapterIds === null ? true : r.chapter_id !== null && chapterIds.includes(r.chapter_id)
        ).length

      // Collapse to one digest per person at their widest scope.
      const byUser = new Map<string, { roles: string[]; chapters: string[] }>()
      for (const r of reviewers ?? []) {
        const entry = byUser.get(r.user_id) ?? { roles: [], chapters: [] }
        entry.roles.push(r.role)
        if (r.chapter_id) entry.chapters.push(r.chapter_id)
        byUser.set(r.user_id, entry)
      }
      const profiles = await emailByUser([...byUser.keys()])

      for (const [userId, entry] of byUser) {
        const isBoard = entry.roles.includes("board_of_director")
        const isPA = entry.roles.includes("program_administrator")
        const isPresident = entry.roles.includes("chapter_president")
        const scopeChapters = isBoard || isPA ? null : entry.chapters
        if (scopeChapters !== null && scopeChapters.length === 0) continue

        const a = countFor(applicants, scopeChapters)
        const s = countFor(students, scopeChapters)
        // Hours: board sees all (incl. corporate); PA chapter-level only;
        // presidents their chapters; plain officers approve nothing.
        const h = isBoard
          ? (hours ?? []).length
          : isPA
            ? (hours ?? []).filter((r) => r.chapter_id !== null).length
            : isPresident
              ? countFor(hours, entry.chapters)
              : 0
        if (a + s + h === 0) continue

        await sendReviewerDigestEmail({
          to: profiles.get(userId)?.email,
          fullName: profiles.get(userId)?.full_name ?? "there",
          applicants: a,
          students: s,
          hours: h,
          scopeLabel: scopeChapters === null ? "across the organization" : "in your chapter",
        })
        summary.reviewerDigests++
      }
    }
  } catch (error) {
    console.error("cron reviewer digest", error)
  }

  // ---------------------------------------------------------------------
  // 4. Practice nudge: Mondays, families with zero logs in 7 days
  // ---------------------------------------------------------------------
  try {
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      weekday: "short",
    }).format(now)
    if (weekday === "Mon") {
      const { data: activeStudents } = await admin
        .from("students")
        .select("id, first_name, last_name, parent_user_id")
        .eq("status", "active")
      const students = activeStudents ?? []
      if (students.length) {
        const weekAgo = new Date(now.getTime() - 7 * 864e5).toISOString().slice(0, 10)
        const { data: recentLogs } = await admin
          .from("practice_logs")
          .select("student_id")
          .gte("practiced_on", weekAgo)
        const practiced = new Set((recentLogs ?? []).map((l) => l.student_id))
        const byFamily = new Map<string, string[]>()
        for (const st of students) {
          if (practiced.has(st.id)) continue
          const list = byFamily.get(st.parent_user_id) ?? []
          list.push(`${st.first_name} ${st.last_name}`)
          byFamily.set(st.parent_user_id, list)
        }
        // Only nudge families where NO student practiced this week.
        for (const st of students) {
          if (practiced.has(st.id)) byFamily.delete(st.parent_user_id)
        }
        const profiles = await emailByUser([...byFamily.keys()])
        for (const [parentId, names] of byFamily) {
          await sendPracticeNudgeEmail({
            to: profiles.get(parentId)?.email,
            studentNames: names,
          })
          summary.practiceNudges++
        }
      }
    }
  } catch (error) {
    console.error("cron practice nudge", error)
  }

  return NextResponse.json({ ok: true, ...summary })
}
