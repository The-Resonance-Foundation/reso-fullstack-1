"use server"

import { revalidatePath } from "next/cache"
import { canManageLessons, isParentAccount, isTutorAccount, verifySession } from "@/lib/auth/dal"
import { revalidateTutorStudentPaths } from "@/lib/portal/revalidate-tutor"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import type { Assignment } from "@/types/database"
import {
  assignmentSchema,
  updateAssignmentStatusSchema,
  type AssignmentFormState,
} from "@/lib/validations/phase23"

export async function createAssignment(
  _prev: AssignmentFormState,
  formData: FormData
): Promise<AssignmentFormState> {
  const validated = assignmentSchema.safeParse({
    studentId: formData.get("studentId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    lessonId: formData.get("lessonId") || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const isTutor = await isTutorAccount()
  if (!isTutor) {
    return { message: "Only tutors can create assignments." }
  }

  const supabase = await getServerClientOrThrow()

  // Tutors may only assign homework to students actively assigned to them —
  // being a tutor elsewhere in the chapter is not enough.
  const { data: assignmentLink } = await supabase
    .from("student_tutor_assignments")
    .select("id")
    .eq("student_id", validated.data.studentId)
    .eq("tutor_user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!assignmentLink) {
    return { message: "You can only assign homework to your own students." }
  }

  const { error } = await supabase.from("assignments").insert({
    student_id: validated.data.studentId,
    tutor_user_id: user.id,
    lesson_id: validated.data.lessonId || null,
    title: validated.data.title,
    description: validated.data.description ?? null,
    due_date: validated.data.dueDate || null,
    status: "assigned",
  })

  if (error) {
    return { message: error.message }
  }

  revalidateTutorStudentPaths(validated.data.studentId)
  return { success: true, message: "Assignment created." }
}

export async function updateAssignmentStatus(
  _prev: AssignmentFormState,
  formData: FormData
): Promise<AssignmentFormState> {
  const validated = updateAssignmentStatusSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    status: formData.get("status"),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const supabase = await getServerClientOrThrow()

  const { data: assignment } = await supabase
    .from("assignments")
    .select("*")
    .eq("id", validated.data.assignmentId)
    .maybeSingle()

  if (!assignment) {
    return { message: "Assignment not found." }
  }

  const record = assignment as Assignment
  const isParent = await isParentAccount()
  const isTutor = await isTutorAccount()

  let parentOwnsStudent = false
  if (isParent && validated.data.status === "submitted") {
    const { data: ownStudent } = await supabase
      .from("students")
      .select("id")
      .eq("id", record.student_id)
      .eq("parent_user_id", user.id)
      .maybeSingle()
    parentOwnsStudent = Boolean(ownStudent)
  }

  if (parentOwnsStudent) {
    // parents mark their own student's work submitted
  } else if (isTutor && record.tutor_user_id === user.id) {
    // tutors can set any status
  } else {
    const { data: student } = await supabase
      .from("students")
      .select("chapter_id")
      .eq("id", record.student_id)
      .maybeSingle()

    const allowed = student
      ? await canManageLessons(student.chapter_id)
      : false
    if (!allowed) {
      return { message: "You are not authorized to update this assignment." }
    }
  }

  const { error } = await supabase
    .from("assignments")
    .update({ status: validated.data.status })
    .eq("id", validated.data.assignmentId)

  if (error) {
    return { message: error.message }
  }

  revalidatePath("/dashboard/assignments")
  revalidateTutorStudentPaths(record.student_id)
  return { success: true, message: "Assignment updated." }
}
