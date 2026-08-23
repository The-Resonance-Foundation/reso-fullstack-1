"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { verifySession, isParentAccount, isTutorAccount } from "@/lib/auth/dal"
import { sendEmail } from "@/lib/email/applicant-rejection"
import { getAuthBaseUrl } from "@/lib/config/url"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import type { FormState } from "@/lib/validations/phase45"

const requestLessonSchema = z.object({
  studentId: z.uuid({ error: "Pick a student." }),
  tutorUserId: z.uuid({ error: "Pick a tutor." }),
  availabilityId: z.uuid({ error: "Pick an availability slot." }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Pick a date." }),
  note: z.string().trim().max(1000).optional(),
})

const decideLessonRequestSchema = z.object({
  requestId: z.uuid(),
  decision: z.enum(["approved", "declined"]),
})

export type LessonRequestFormState = FormState

async function notifyUser({
  userId,
  title,
  body,
  linkPath,
  emailHtml,
  emailSubject,
}: {
  userId: string
  title: string
  body: string
  linkPath: string
  emailSubject: string
  emailHtml: string
}) {
  try {
    const admin = createAdminClient()
    await admin.from("notifications").insert({
      user_id: userId,
      notification_type: "assignment" as const,
      title,
      body,
      link_path: linkPath,
    })
    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle()
    if (profile?.email && !profile.email.endsWith("@resonance.test")) {
      await sendEmail({ to: profile.email, subject: emailSubject, html: emailHtml })
    }
  } catch (error) {
    console.error("lesson-request notify", error)
  }
}

export async function requestLesson(
  _prev: LessonRequestFormState,
  formData: FormData
): Promise<LessonRequestFormState> {
  const validated = requestLessonSchema.safeParse({
    studentId: formData.get("studentId"),
    tutorUserId: formData.get("tutorUserId"),
    availabilityId: formData.get("availabilityId"),
    date: formData.get("date"),
    note: formData.get("note") || undefined,
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  if (!(await isParentAccount())) {
    return { message: "Only parent accounts can request lessons." }
  }

  const admin = createAdminClient()
  const { data: slot } = await admin
    .from("tutor_availability")
    .select("*")
    .eq("id", validated.data.availabilityId)
    .eq("tutor_user_id", validated.data.tutorUserId)
    .maybeSingle()
  if (!slot) {
    return { message: "That availability slot no longer exists." }
  }

  // Same local-time construction the rest of scheduling uses.
  const start = new Date(`${validated.data.date}T${slot.start_time}`)
  const end = new Date(`${validated.data.date}T${slot.end_time}`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { message: "Pick a valid date." }
  }
  if (start.getDay() !== slot.day_of_week) {
    return { message: "That date doesn't fall on the tutor's available day." }
  }
  if (start.getTime() < Date.now()) {
    return { message: "Pick a future date." }
  }

  const { data: student } = await admin
    .from("students")
    .select("chapter_id, first_name, last_name")
    .eq("id", validated.data.studentId)
    .maybeSingle()
  if (!student) {
    return { message: "Student not found." }
  }

  // RLS enforces parent ownership + an active tutor assignment on insert.
  const supabase = await getServerClientOrThrow()
  const { error } = await supabase.from("lesson_requests").insert({
    chapter_id: student.chapter_id,
    student_id: validated.data.studentId,
    parent_user_id: user.id,
    tutor_user_id: validated.data.tutorUserId,
    availability_id: validated.data.availabilityId,
    requested_start: start.toISOString(),
    requested_end: end.toISOString(),
    note: validated.data.note ?? null,
  })
  if (error) {
    console.error("requestLesson", error.message)
    return { message: "Couldn't submit the request. Please try again." }
  }

  const when = start.toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
  await notifyUser({
    userId: validated.data.tutorUserId,
    title: "New lesson request",
    body: `${student.first_name} ${student.last_name} · ${when}`,
    linkPath: "/dashboard/lessons",
    emailSubject: "New lesson request in the Resonance portal",
    emailHtml: `
      <p>A parent requested a lesson for <strong>${student.first_name} ${student.last_name}</strong> on <strong>${when}</strong>.</p>
      <p><a href="${getAuthBaseUrl()}/dashboard/lessons">Review the request</a> to approve or decline it.</p>
      <p>— The Resonance Foundation</p>
    `,
  })

  revalidatePath("/dashboard/lessons")
  return { success: true, message: "Lesson request sent to the tutor." }
}

export async function cancelLessonRequest(
  _prev: LessonRequestFormState,
  formData: FormData
): Promise<LessonRequestFormState> {
  const requestId = String(formData.get("requestId") ?? "")
  if (!requestId) return { message: "Missing request." }

  await verifySession()
  // RLS only lets the owning parent flip their own pending request.
  const supabase = await getServerClientOrThrow()
  const { error } = await supabase
    .from("lesson_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId)
  if (error) {
    console.error("cancelLessonRequest", error.message)
    return { message: "Couldn't cancel the request." }
  }
  revalidatePath("/dashboard/lessons")
  return { success: true, message: "Request cancelled." }
}

export async function decideLessonRequest(
  _prev: LessonRequestFormState,
  formData: FormData
): Promise<LessonRequestFormState> {
  const validated = decideLessonRequestSchema.safeParse({
    requestId: formData.get("requestId"),
    decision: formData.get("decision"),
  })
  if (!validated.success) {
    return { message: "Invalid decision." }
  }

  const user = await verifySession()
  if (!(await isTutorAccount())) {
    return { message: "Only tutors can decide lesson requests." }
  }

  const supabase = await getServerClientOrThrow()
  const { data: request } = await supabase
    .from("lesson_requests")
    .select("*, students(first_name, last_name)")
    .eq("id", validated.data.requestId)
    .eq("tutor_user_id", user.id)
    .eq("status", "pending")
    .maybeSingle()
  if (!request) {
    return { message: "Request not found or already decided." }
  }

  let lessonId: string | null = null
  if (validated.data.decision === "approved") {
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .insert({
        chapter_id: request.chapter_id,
        tutor_user_id: user.id,
        student_id: request.student_id,
        scheduled_start: request.requested_start,
        scheduled_end: request.requested_end,
        created_by: user.id,
      })
      .select("id")
      .single()
    if (lessonError || !lesson) {
      console.error("decideLessonRequest lesson", lessonError?.message)
      return { message: "Couldn't create the lesson. Please try again." }
    }
    lessonId = lesson.id
  }

  const { error: updateError } = await supabase
    .from("lesson_requests")
    .update({
      status: validated.data.decision,
      decided_by: user.id,
      decided_at: new Date().toISOString(),
      lesson_id: lessonId,
    })
    .eq("id", validated.data.requestId)
  if (updateError) {
    console.error("decideLessonRequest update", updateError.message)
    return { message: "Couldn't update the request. Please try again." }
  }

  const studentName = request.students
    ? `${request.students.first_name} ${request.students.last_name}`
    : "your student"
  const when = new Date(request.requested_start).toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
  const approved = validated.data.decision === "approved"
  await notifyUser({
    userId: request.parent_user_id,
    title: approved ? "Lesson request approved" : "Lesson request declined",
    body: `${studentName} · ${when}`,
    linkPath: "/dashboard/lessons",
    emailSubject: approved
      ? "Your lesson request was approved"
      : "Update on your lesson request",
    emailHtml: approved
      ? `
        <p>Your lesson request for <strong>${studentName}</strong> on <strong>${when}</strong> was approved — it's on the calendar.</p>
        <p><a href="${getAuthBaseUrl()}/dashboard/lessons">View your lessons</a></p>
        <p>— The Resonance Foundation</p>
      `
      : `
        <p>Your lesson request for <strong>${studentName}</strong> on <strong>${when}</strong> couldn't be accommodated this time. Feel free to request another slot, or message your tutor to find a time.</p>
        <p><a href="${getAuthBaseUrl()}/dashboard/lessons">Request another time</a></p>
        <p>— The Resonance Foundation</p>
      `,
  })

  revalidatePath("/dashboard/lessons")
  return {
    success: true,
    message: approved ? "Request approved and lesson scheduled." : "Request declined.",
  }
}
