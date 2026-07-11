"use server"

import { revalidatePath } from "next/cache"
import { canManageEvents, verifySession } from "@/lib/auth/dal"
import { canRsvpGoing } from "@/lib/events/helpers"
import { getEventWithMeta } from "@/lib/data/phase23"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import type { Event } from "@/types/database"
import {
  attendanceSchema,
  eventSchema,
  rsvpSchema,
  type EventFormState,
  type RsvpFormState,
} from "@/lib/validations/phase23"

/**
 * RSVP capacity is enforced by a DB trigger (`enforce_event_capacity`) as
 * the race-safe source of truth — the app-level pre-check below is just an
 * optimistic fast path. When two people RSVP at once, the trigger raises
 * `Event is at capacity`; surface that as a friendly toast instead of a raw
 * Postgres error.
 */
function friendlyRsvpError(message: string) {
  if (/at capacity/i.test(message)) {
    return "This event just filled up — try RSVPing \"Maybe\" or check back if a spot opens."
  }
  return message
}

export async function createEvent(
  _prev: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const validated = eventSchema.safeParse({
    chapterId: formData.get("chapterId") || undefined,
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    location: formData.get("location") || undefined,
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    capacity: formData.get("capacity") || undefined,
    status: formData.get("status") || "published",
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const chapterId = validated.data.chapterId || null
  const allowed = chapterId
    ? await canManageEvents(chapterId)
    : await canManageEvents()

  if (!allowed) {
    return { message: "You are not authorized to create events." }
  }

  const start = new Date(validated.data.startsAt)
  const end = new Date(validated.data.endsAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return { message: "End time must be after start time." }
  }

  const supabase = await getServerClientOrThrow()
  const { error } = await supabase.from("events").insert({
    chapter_id: chapterId,
    title: validated.data.title,
    description: validated.data.description ?? null,
    location: validated.data.location ?? null,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    capacity:
      validated.data.capacity === "" || validated.data.capacity === undefined
        ? null
        : Number(validated.data.capacity),
    status: validated.data.status,
    created_by: user.id,
  })

  if (error) {
    return { message: error.message }
  }

  revalidatePath("/dashboard/events")
  revalidatePath("/dashboard/calendar")
  return { success: true, message: "Event created." }
}

export async function updateEventStatus(
  _prev: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const eventId = String(formData.get("eventId") ?? "")
  const status = String(formData.get("status") ?? "")
  if (!eventId || !status) {
    return { message: "Missing event id or status." }
  }

  await verifySession()
  const supabase = await getServerClientOrThrow()

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle()

  if (!event) {
    return { message: "Event not found." }
  }

  const record = event as Event
  const allowed = record.chapter_id
    ? await canManageEvents(record.chapter_id)
    : await canManageEvents()

  if (!allowed) {
    return { message: "You are not authorized to update this event." }
  }

  const { error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId)

  if (error) {
    return { message: error.message }
  }

  revalidatePath("/dashboard/events")
  revalidatePath(`/dashboard/events/${eventId}`)
  revalidatePath("/dashboard/calendar")
  return { success: true, message: "Event updated." }
}

export async function submitRsvp(
  _prev: RsvpFormState,
  formData: FormData
): Promise<RsvpFormState> {
  const validated = rsvpSchema.safeParse({
    eventId: formData.get("eventId"),
    status: formData.get("status"),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const event = await getEventWithMeta(validated.data.eventId)

  if (!event) {
    return { message: "Event not found." }
  }

  if (validated.data.status === "going") {
    const currentGoing =
      event.userRsvp?.status === "going"
        ? event.goingCount - 1
        : event.goingCount

    if (!canRsvpGoing(event.capacity, currentGoing)) {
      return { message: friendlyRsvpError("Event is at capacity") }
    }
  }

  const supabase = await getServerClientOrThrow()
  const { error } = await supabase.from("event_rsvps").upsert(
    {
      event_id: validated.data.eventId,
      user_id: user.id,
      status: validated.data.status,
    },
    { onConflict: "event_id,user_id" }
  )

  if (error) {
    return { message: friendlyRsvpError(error.message) }
  }

  revalidatePath("/dashboard/events")
  revalidatePath(`/dashboard/events/${validated.data.eventId}`)
  return { success: true, message: "RSVP saved." }
}

export async function recordAttendance(
  _prev: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const validated = attendanceSchema.safeParse({
    eventId: formData.get("eventId"),
    userId: formData.get("userId"),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const supabase = await getServerClientOrThrow()

  const { data: event } = await supabase
    .from("events")
    .select("chapter_id")
    .eq("id", validated.data.eventId)
    .maybeSingle()

  if (!event) {
    return { message: "Event not found." }
  }

  const allowed = event.chapter_id
    ? await canManageEvents(event.chapter_id)
    : await canManageEvents()

  if (!allowed) {
    return { message: "You are not authorized to record attendance." }
  }

  const { error } = await supabase.from("event_attendance").upsert(
    {
      event_id: validated.data.eventId,
      user_id: validated.data.userId,
      recorded_by: user.id,
      checked_in_at: new Date().toISOString(),
    },
    { onConflict: "event_id,user_id" }
  )

  if (error) {
    return { message: error.message }
  }

  revalidatePath(`/dashboard/events/${validated.data.eventId}`)
  return { success: true, message: "Attendance recorded." }
}
