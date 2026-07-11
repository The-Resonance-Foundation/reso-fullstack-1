"use server"

import { canManageLessons, isTutorAccount, verifySession } from "@/lib/auth/dal"
import { isValidLessonStatusTransition } from "@/lib/events/helpers"
import { revalidateTutorStudentPaths } from "@/lib/portal/revalidate-tutor"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import type { Lesson } from "@/types/database"
import {
  lessonLogSchema,
  scheduleLessonSchema,
  updateLessonStatusSchema,
  type LessonFormState,
} from "@/lib/validations/phase23"

export async function scheduleLesson(
  _prev: LessonFormState,
  formData: FormData
): Promise<LessonFormState> {
  const validated = scheduleLessonSchema.safeParse({
    studentId: formData.get("studentId"),
    chapterId: formData.get("chapterId"),
    scheduledStart: formData.get("scheduledStart"),
    scheduledEnd: formData.get("scheduledEnd"),
    location: formData.get("location") || undefined,
    meetingLink: formData.get("meetingLink") || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const isTutor = await isTutorAccount()
  if (!isTutor) {
    return { message: "Only tutors can schedule lessons." }
  }

  const start = new Date(validated.data.scheduledStart)
  const end = new Date(validated.data.scheduledEnd)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return { message: "End time must be after start time." }
  }

  const supabase = await getServerClientOrThrow()

  const { data: student } = await supabase
    .from("students")
    .select("chapter_id")
    .eq("id", validated.data.studentId)
    .maybeSingle()

  if (!student) {
    return { message: "Student not found." }
  }

  const allowed = await canManageLessons(student.chapter_id)
  if (!allowed) {
    return { message: "You are not authorized to schedule lessons for this chapter." }
  }

  const { error } = await supabase.from("lessons").insert({
    chapter_id: student.chapter_id,
    tutor_user_id: user.id,
    student_id: validated.data.studentId,
    scheduled_start: start.toISOString(),
    scheduled_end: end.toISOString(),
    location: validated.data.location ?? null,
    meeting_link: validated.data.meetingLink || null,
    created_by: user.id,
    status: "scheduled",
  })

  if (error) {
    if (error.code === "42501") {
      return {
        message: "You can only schedule lessons for students assigned to you.",
      }
    }
    return { message: error.message }
  }

  revalidateTutorStudentPaths(validated.data.studentId)
  return { success: true, message: "Lesson scheduled." }
}

export async function logLesson(
  _prev: LessonFormState,
  formData: FormData
): Promise<LessonFormState> {
  const validated = lessonLogSchema.safeParse({
    lessonId: formData.get("lessonId"),
    attendance: formData.get("attendance"),
    topicsCovered: formData.get("topicsCovered") || undefined,
    tutorNotes: formData.get("tutorNotes") || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const supabase = await getServerClientOrThrow()

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", validated.data.lessonId)
    .maybeSingle()

  if (!lesson) {
    return { message: "Lesson not found." }
  }

  const record = lesson as Lesson
  const allowed = await canManageLessons(record.chapter_id)
  if (!allowed && record.tutor_user_id !== user.id) {
    return { message: "You are not authorized to log this lesson." }
  }

  const { error: logError } = await supabase.from("lesson_logs").upsert(
    {
      lesson_id: validated.data.lessonId,
      attendance: validated.data.attendance,
      topics_covered: validated.data.topicsCovered ?? null,
      tutor_notes: validated.data.tutorNotes ?? null,
      created_by: user.id,
    },
    { onConflict: "lesson_id" }
  )

  if (logError) {
    return { message: logError.message }
  }

  await supabase
    .from("lessons")
    .update({ status: "completed" })
    .eq("id", validated.data.lessonId)

  revalidateTutorStudentPaths(record.student_id)
  return { success: true, message: "Lesson log saved." }
}

export async function updateLessonStatus(
  _prev: LessonFormState,
  formData: FormData
): Promise<LessonFormState> {
  const validated = updateLessonStatusSchema.safeParse({
    lessonId: formData.get("lessonId"),
    status: formData.get("status"),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const supabase = await getServerClientOrThrow()

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", validated.data.lessonId)
    .maybeSingle()

  if (!lesson) {
    return { message: "Lesson not found." }
  }

  const record = lesson as Lesson
  if (
    !isValidLessonStatusTransition(record.status, validated.data.status)
  ) {
    return { message: `Cannot change lesson status from ${record.status} to ${validated.data.status}.` }
  }

  const allowed = await canManageLessons(record.chapter_id)
  if (!allowed && record.tutor_user_id !== user.id) {
    return { message: "You are not authorized to update this lesson." }
  }

  const { error } = await supabase
    .from("lessons")
    .update({ status: validated.data.status })
    .eq("id", validated.data.lessonId)

  if (error) {
    return { message: error.message }
  }

  revalidateTutorStudentPaths(record.student_id)
  return { success: true, message: "Lesson status updated." }
}
