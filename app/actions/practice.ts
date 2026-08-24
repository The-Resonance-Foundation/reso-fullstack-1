"use server"

import { revalidatePath } from "next/cache"
import { isParentAccount, verifySession } from "@/lib/auth/dal"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import {
  practiceLogSchema,
  type PracticeFormState,
} from "@/lib/validations/phase23"
import { sendPracticeMilestoneEmail } from "@/lib/email/reminders"

const STREAK_MILESTONES = [7, 30, 100]

/** Consecutive practiced days ending at the given date. */
async function streakEndingAt(
  supabase: Awaited<ReturnType<typeof getServerClientOrThrow>>,
  studentId: string,
  endDate: string
) {
  const { data } = await supabase
    .from("practice_logs")
    .select("practiced_on")
    .eq("student_id", studentId)
    .lte("practiced_on", endDate)
    .order("practiced_on", { ascending: false })
    .limit(150)
  const days = [...new Set((data ?? []).map((d) => d.practiced_on))]
  let streak = 0
  let cursor = new Date(`${endDate}T00:00:00Z`)
  for (const day of days) {
    if (day !== cursor.toISOString().slice(0, 10)) break
    streak++
    cursor = new Date(cursor.getTime() - 864e5)
  }
  return streak
}

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

  // The student must belong to this parent — never trust the submitted id.
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("id", validated.data.studentId)
    .eq("parent_user_id", user.id)
    .maybeSingle()

  if (!student) {
    return { message: "You can only log practice for your own students." }
  }

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

  // Celebrate streak milestones the moment they happen.
  try {
    const streak = await streakEndingAt(
      supabase,
      validated.data.studentId,
      validated.data.practicedOn
    )
    if (STREAK_MILESTONES.includes(streak)) {
      const { data: studentRow } = await supabase
        .from("students")
        .select("first_name, last_name")
        .eq("id", validated.data.studentId)
        .maybeSingle()
      await sendPracticeMilestoneEmail({
        to: user.email,
        studentName: studentRow
          ? `${studentRow.first_name} ${studentRow.last_name}`
          : "Your student",
        streak,
      })
    }
  } catch (milestoneError) {
    console.error("practice milestone email", milestoneError)
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
