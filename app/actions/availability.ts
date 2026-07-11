"use server"

import { revalidatePath } from "next/cache"
import { isTutorAccount, verifySession } from "@/lib/auth/dal"
import { getTutorAvailability } from "@/lib/data/phase23"
import { hasAvailabilityOverlap } from "@/lib/lessons/helpers"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import {
  availabilitySchema,
  type AvailabilityFormState,
} from "@/lib/validations/phase23"

export async function addAvailability(
  _prev: AvailabilityFormState,
  formData: FormData
): Promise<AvailabilityFormState> {
  const validated = availabilitySchema.safeParse({
    chapterId: formData.get("chapterId"),
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const isTutor = await isTutorAccount()
  if (!isTutor) {
    return { message: "Only tutors can manage availability." }
  }

  if (validated.data.endTime <= validated.data.startTime) {
    return { message: "End time must be after start time." }
  }

  const existing = await getTutorAvailability(user.id)
  const candidate = {
    dayOfWeek: validated.data.dayOfWeek,
    startTime: validated.data.startTime,
    endTime: validated.data.endTime,
  }

  if (
    hasAvailabilityOverlap(
      existing.map((slot) => ({
        dayOfWeek: slot.day_of_week,
        startTime: slot.start_time.slice(0, 5),
        endTime: slot.end_time.slice(0, 5),
      })),
      candidate
    )
  ) {
    return { message: "This slot overlaps with existing availability." }
  }

  const supabase = await getServerClientOrThrow()
  const { error } = await supabase.from("tutor_availability").insert({
    tutor_user_id: user.id,
    chapter_id: validated.data.chapterId,
    day_of_week: validated.data.dayOfWeek,
    start_time: validated.data.startTime,
    end_time: validated.data.endTime,
  })

  if (error) {
    if (
      error.code === "23P01" ||
      error.message?.includes("tutor_availability_no_overlap")
    ) {
      return { message: "This overlaps an existing slot." }
    }
    return { message: error.message }
  }

  revalidatePath("/dashboard/availability")
  revalidatePath("/dashboard/calendar")
  return { success: true, message: "Availability added." }
}

export async function deleteAvailability(
  _prev: AvailabilityFormState,
  formData: FormData
): Promise<AvailabilityFormState> {
  const id = String(formData.get("id") ?? "")
  if (!id) return { message: "Missing availability id." }

  const user = await verifySession()
  const isTutor = await isTutorAccount()
  if (!isTutor) {
    return { message: "Only tutors can manage availability." }
  }

  const supabase = await getServerClientOrThrow()
  const { error } = await supabase
    .from("tutor_availability")
    .delete()
    .eq("id", id)
    .eq("tutor_user_id", user.id)

  if (error) {
    return { message: error.message }
  }

  revalidatePath("/dashboard/availability")
  revalidatePath("/dashboard/calendar")
  return { success: true, message: "Availability removed." }
}
