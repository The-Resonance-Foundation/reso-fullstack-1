"use server"

import { revalidatePath } from "next/cache"
import { verifySession } from "@/lib/auth/dal"
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
