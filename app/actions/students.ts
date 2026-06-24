"use server"

import { revalidatePath } from "next/cache"
import { getUserRoles, isParentAccount, verifySession } from "@/lib/auth/dal"
import { parentMayEnrollInChapter } from "@/lib/auth/signup-utils"
import { addStudentSchema, type AddStudentFormState } from "@/lib/validations/students"
import { splitStudentName } from "@/lib/students/name"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import { V1_REQUIRED_CONSENTS } from "@/types/enums"

export async function addStudent(
  _prev: AddStudentFormState,
  formData: FormData
): Promise<AddStudentFormState> {
  const validated = addStudentSchema.safeParse({
    studentName: formData.get("studentName"),
    chapterId: formData.get("chapterId"),
    instrument: formData.get("instrument"),
    skillLevel: formData.get("skillLevel") || undefined,
    consentsAccepted: formData.get("consentsAccepted"),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()

  const isParent = await isParentAccount()
  if (!isParent) {
    return { message: "Only parent accounts can add students." }
  }

  const roles = await getUserRoles()
  const parentChapterIds = roles
    .filter((role) => role.role === "student_parent")
    .map((role) => role.chapter_id)

  if (!parentMayEnrollInChapter(validated.data.chapterId, parentChapterIds)) {
    return { message: "You can only add students for your assigned chapter." }
  }

  const supabase = await getServerClientOrThrow()
  const { first_name, last_name } = splitStudentName(validated.data.studentName)

  const { data: student, error } = await supabase
    .from("students")
    .insert({
      parent_user_id: user.id,
      chapter_id: validated.data.chapterId,
      first_name,
      last_name,
      instrument: validated.data.instrument,
      skill_level: validated.data.skillLevel ?? null,
      status: "pending",
    })
    .select("id")
    .single()

  if (error || !student) {
    return { message: error?.message ?? "Could not add student." }
  }

  const consentRows = V1_REQUIRED_CONSENTS.map((consent_type) => ({
    student_id: student.id,
    consent_type,
    signed_by_user_id: user.id,
  }))

  const { error: consentError } = await supabase
    .from("guardian_consents")
    .insert(consentRows)

  if (consentError) {
    await supabase.from("students").delete().eq("id", student.id)
    return { message: consentError.message }
  }

  revalidatePath("/dashboard/students")
  revalidatePath("/dashboard/admin/families")
  revalidatePath("/dashboard")

  return {
    success: true,
    message: `${validated.data.studentName} has been submitted for chapter review.`,
  }
}
