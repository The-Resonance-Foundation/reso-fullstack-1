import { z } from "zod"
import { VOLUNTEER_HOUR_CATEGORIES, VOLUNTEER_HOUR_STATUSES } from "@/types/enums"

export type FormState =
  | { errors?: Record<string, string[] | undefined>; message?: string; success?: boolean }
  | undefined

export const volunteerHourSchema = z.object({
  chapterId: z.uuid({ error: "Please select a chapter." }),
  category: z.enum(VOLUNTEER_HOUR_CATEGORIES),
  hours: z.coerce.number().gt(0).max(24),
  activityDate: z.string().min(1),
  description: z.string().trim().optional(),
})

export const volunteerHourUpdateSchema = volunteerHourSchema.extend({ id: z.uuid() })
export const approveVolunteerHoursSchema = z.object({ hourIds: z.array(z.uuid()).min(1) })
export const rejectVolunteerHoursSchema = z.object({
  hourId: z.uuid(),
  reason: z.string().trim().optional(),
})

export const messageSchema = z.object({
  conversationId: z.uuid(),
  body: z.string().trim().min(1).max(4000),
})

export const announcementSchema = z.object({
  chapterId: z.string().optional(),
  title: z.string().min(2).trim(),
  body: z.string().min(2).trim(),
})

export type VolunteerHourFormState = FormState
export type MessageFormState = FormState
export type AnnouncementFormState = FormState
export type NotificationFormState = FormState

export function isValidVolunteerHourTransition(
  from: (typeof VOLUNTEER_HOUR_STATUSES)[number],
  to: (typeof VOLUNTEER_HOUR_STATUSES)[number]
) {
  return from === "pending" && (to === "approved" || to === "rejected")
}

export function isActivityDateValid(dateStr: string) {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return false
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return date.getTime() <= today.getTime()
}
