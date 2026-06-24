"use server"

import { revalidatePath } from "next/cache"
import { isParentAccount, verifySession } from "@/lib/auth/dal"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import {
  practiceLogSchema,
  type PracticeFormState,
} from "@/lib/validations/phase23"

export async function addPracticeLog(
  _prev: PracticeFormState,
  formData: FormData
): Promise<PracticeFormState> {
  const validated = practiceLogSchema.safeParse({
    studentId: formData.get("studentId"),
    minutes: formData.get("minutes"),
    practicedOn: formData.get("practicedOn"),
    notes: formData.get("notes") || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const isParent = await isParentAccount()
  if (!isParent) {
    return { message: "Only parents can log practice time." }
  }

  const supabase = await getServerClientOrThrow()
  const { error } = await supabase.from("practice_logs").insert({
    student_id: validated.data.studentId,
    minutes: validated.data.minutes,
    practiced_on: validated.data.practicedOn,
    notes: validated.data.notes ?? null,
    logged_by: user.id,
  })

  if (error) {
    return { message: error.message }
  }

  revalidatePath("/dashboard/practice")
  revalidatePath("/dashboard")
  return { success: true, message: "Practice logged." }
}

export async function deletePracticeLog(
  _prev: PracticeFormState,
  formData: FormData
): Promise<PracticeFormState> {
  const id = String(formData.get("id") ?? "")
  if (!id) return { message: "Missing practice log id." }

  const user = await verifySession()
  const isParent = await isParentAccount()
  if (!isParent) {
    return { message: "Only parents can delete practice logs." }
  }

  const supabase = await getServerClientOrThrow()
  const { error } = await supabase
    .from("practice_logs")
    .delete()
    .eq("id", id)
    .eq("logged_by", user.id)

  if (error) {
    return { message: error.message }
  }

  revalidatePath("/dashboard/practice")
  return { success: true, message: "Practice log removed." }
}
