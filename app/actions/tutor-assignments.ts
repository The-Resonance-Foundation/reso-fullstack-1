"use server"

import { revalidatePath } from "next/cache"
import { canReviewApplicants, verifySession } from "@/lib/auth/dal"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import {
  tutorAssignmentSchema,
  type TutorAssignmentFormState,
} from "@/lib/validations/phase23"

export async function assignTutorToStudent(
  _prev: TutorAssignmentFormState,
  formData: FormData
): Promise<TutorAssignmentFormState> {
  const validated = tutorAssignmentSchema.safeParse({
    studentId: formData.get("studentId"),
    tutorUserId: formData.get("tutorUserId"),
    chapterId: formData.get("chapterId"),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const admin = createAdminClient()

  const { data: student } = await admin
    .from("students")
    .select("chapter_id")
    .eq("id", validated.data.studentId)
    .maybeSingle()

  if (!student) {
    return { message: "Student not found." }
  }

  const allowed = await canReviewApplicants(student.chapter_id)
  if (!allowed) {
    return { message: "You are not authorized to assign tutors." }
  }

  const { data: tutorRole } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", validated.data.tutorUserId)
    .eq("chapter_id", student.chapter_id)
    .eq("role", "tutor")
    .eq("status", "active")
    .maybeSingle()

  if (!tutorRole) {
    return {
      message: "That tutor is not active in this student's chapter.",
    }
  }

  const { error } = await admin
    .from("student_tutor_assignments")
    .upsert(
      {
        student_id: validated.data.studentId,
        tutor_user_id: validated.data.tutorUserId,
        chapter_id: student.chapter_id,
        status: "active",
        assigned_by: user.id,
      },
      { onConflict: "student_id,tutor_user_id" }
    )
    .select("id")
    .single()

  if (error) {
    return { message: error.message }
  }

  const { ensureTutorStudentConversation } = await import(
    "@/lib/messaging/ensure-conversation"
  )
  const conversation = await ensureTutorStudentConversation({
    studentId: validated.data.studentId,
    tutorUserId: validated.data.tutorUserId,
    chapterId: student.chapter_id,
  })

  if (conversation.error) {
    console.error("ensureTutorStudentConversation", conversation.error)
    revalidatePath("/dashboard/admin/tutor-assignments")
    revalidatePath("/dashboard/messages")
    return {
      success: true,
      message: `Tutor assigned, but the message thread could not be created: ${conversation.error}. Contact support if messaging stays empty.`,
    }
  }

  revalidatePath("/dashboard/admin/tutor-assignments")
  revalidatePath("/dashboard/lessons")
  revalidatePath("/dashboard/messages")
  revalidatePath(`/dashboard/messages/${conversation.conversationId}`)
  return { success: true, message: "Tutor assigned to student." }
}

export async function removeTutorAssignment(
  _prev: TutorAssignmentFormState,
  formData: FormData
): Promise<TutorAssignmentFormState> {
  const id = String(formData.get("id") ?? "")
  if (!id) return { message: "Missing assignment id." }

  await verifySession()
  const supabase = await getServerClientOrThrow()

  const { data: row } = await supabase
    .from("student_tutor_assignments")
    .select("chapter_id")
    .eq("id", id)
    .maybeSingle()

  if (!row) {
    return { message: "Assignment not found." }
  }

  const allowed = await canReviewApplicants(row.chapter_id)
  if (!allowed) {
    return { message: "You are not authorized to remove this assignment." }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from("student_tutor_assignments")
    .update({ status: "inactive" })
    .eq("id", id)

  if (error) {
    return { message: error.message }
  }

  revalidatePath("/dashboard/admin/tutor-assignments")
  return { success: true, message: "Tutor assignment removed." }
}
