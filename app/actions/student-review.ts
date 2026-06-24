"use server"

import { revalidatePath } from "next/cache"
import { canReviewApplicants, verifySession } from "@/lib/auth/dal"
import { sendStudentRejectionEmail } from "@/lib/email/student-rejection"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import type { Student } from "@/types/database"

export type StudentReviewState =
  | { message?: string; success?: boolean }
  | undefined

export async function acceptStudent(
  _prev: StudentReviewState,
  formData: FormData
): Promise<StudentReviewState> {
  const studentId = String(formData.get("studentId") ?? "")
  if (!studentId) return { message: "Missing student." }

  const reviewer = await verifySession()
  const supabase = await getServerClientOrThrow()

  const { data: student, error: fetchError } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle()

  if (fetchError || !student) {
    return { message: "Student not found or access denied." }
  }

  const record = student as Student
  const allowed = await canReviewApplicants(record.chapter_id)
  if (!allowed) {
    return { message: "You are not authorized to review this student." }
  }

  if (record.status !== "pending") {
    return { message: "Only pending students can be accepted." }
  }

  const { error } = await supabase
    .from("students")
    .update({
      status: "active",
      reviewed_by: reviewer.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", studentId)

  if (error) return { message: error.message }

  revalidatePath("/dashboard/admin/families")
  revalidatePath("/dashboard/students")
  revalidatePath("/dashboard")

  return {
    success: true,
    message: `${record.first_name} ${record.last_name} has been accepted.`,
  }
}

export async function rejectStudent(
  _prev: StudentReviewState,
  formData: FormData
): Promise<StudentReviewState> {
  const studentId = String(formData.get("studentId") ?? "")
  if (!studentId) return { message: "Missing student." }

  const reviewer = await verifySession()
  const supabase = await getServerClientOrThrow()

  const { data: student, error: fetchError } = await supabase
    .from("students")
    .select("*, chapters(name)")
    .eq("id", studentId)
    .maybeSingle()

  if (fetchError || !student) {
    return { message: "Student not found or access denied." }
  }

  const record = student as Student & { chapters?: { name: string } | null }
  const allowed = await canReviewApplicants(record.chapter_id)
  if (!allowed) {
    return { message: "You are not authorized to review this student." }
  }

  if (record.status !== "pending") {
    return { message: "Only pending students can be rejected." }
  }

  const { error } = await supabase
    .from("students")
    .update({
      status: "rejected",
      reviewed_by: reviewer.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", studentId)

  if (error) return { message: error.message }

  const admin = await import("@/lib/supabase/admin").then((m) => m.createAdminClient())
  const { data: authUser } = await admin.auth.admin.getUserById(record.parent_user_id)
  const parentEmail = authUser.user?.email

  if (parentEmail) {
    const emailResult = await sendStudentRejectionEmail({
      to: parentEmail,
      studentName: `${record.first_name} ${record.last_name}`,
      chapterName: record.chapters?.name,
    })

    if (!emailResult.sent) {
      return {
        success: true,
        message: `${record.first_name} ${record.last_name} rejected. Email was not sent (${emailResult.reason}).`,
      }
    }
  }

  revalidatePath("/dashboard/admin/families")
  revalidatePath("/dashboard/students")
  revalidatePath("/dashboard")

  return {
    success: true,
    message: `${record.first_name} ${record.last_name} has been rejected.`,
  }
}
