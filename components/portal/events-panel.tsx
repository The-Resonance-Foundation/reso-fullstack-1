"use client"

import Link from "next/link"
import { useActionState } from "react"
import { createEvent, recordAttendance, submitRsvp, updateEventStatus } from "@/app/actions/events"
import { FormFieldError } from "@/components/forms/form-field-error"
import { NativeSelect } from "@/components/forms/native-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { routes } from "@/lib/routes"
import type { Chapter, Event } from "@/types/database"
import { EVENT_STATUSES, RSVP_STATUSES } from "@/types/enums"
import type { EventWithMeta } from "@/lib/data/phase23"
import { remainingEventCapacity } from "@/lib/events/helpers"

export function EventForm({ chapters }: { chapters: Chapter[] }) {
  const [state, action, pending] = useActionState(createEvent, undefined)

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="chapterId">Chapter (leave blank for org-wide)</Label>
        <NativeSelect id="chapterId" name="chapterId" defaultValue="">
          <option value="">Organization-wide</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
        <FormFieldError errors={state?.errors?.title} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startsAt">Starts</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endsAt">Ends</Label>
          <Input id="endsAt" name="endsAt" type="datetime-local" required />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity (optional)</Label>
          <Input id="capacity" name="capacity" type="number" min={1} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <NativeSelect id="status" name="status" defaultValue="published">
            {EVENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </NativeSelect>
        </div>
      </div>
      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create event"}</Button>
    </form>
  )
}

export function EventsList({ events }: { events: Event[] }) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground">No upcoming events.</p>
  }

  return (
    <ul className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="rounded-md border p-4 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                href={`${routes.portal.events}/${event.id}`}
                className="font-medium text-primary hover:underline"
              >
                {event.title}
              </Link>
              <p className="text-muted-foreground">
                {new Date(event.starts_at).toLocaleString()}
                {event.chapters?.name ? ` · ${event.chapters.name}` : " · Org-wide"}
              </p>
              {event.location ? <p>{event.location}</p> : null}
            </div>
            <Badge variant="outline">{event.status}</Badge>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function EventDetailPanel({
  event,
  canManage,
}: {
  event: EventWithMeta
  canManage: boolean
}) {
  const [rsvpState, rsvpAction, rsvpPending] = useActionState(submitRsvp, undefined)
  const [statusState, statusAction, statusPending] = useActionState(updateEventStatus, undefined)
  const remaining = remainingEventCapacity(event.capacity, event.goingCount)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold">{event.title}</h2>
        <p className="mt-1 text-muted-foreground">
          {new Date(event.starts_at).toLocaleString()} – {new Date(event.ends_at).toLocaleString()}
        </p>
        {event.chapters?.name ? <p>{event.chapters.name}</p> : <p>Organization-wide</p>}
        {event.location ? <p>Location: {event.location}</p> : null}
        {event.description ? <p className="mt-2">{event.description}</p> : null}
        {event.capacity !== null ? (
          <p className="mt-2 text-sm">
            {event.goingCount} / {event.capacity} going
            {remaining === 0 ? " · Full" : remaining !== null ? ` · ${remaining} spots left` : ""}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Your RSVP</p>
        <div className="flex flex-wrap gap-2">
          {RSVP_STATUSES.map((status) => (
            <form key={status} action={rsvpAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="status" value={status} />
              <Button
                type="submit"
                size="sm"
                variant={event.userRsvp?.status === status ? "default" : "outline"}
                disabled={rsvpPending}
              >
                {status}
              </Button>
            </form>
          ))}
        </div>
        {rsvpState?.message ? (
          <p className={`text-xs ${rsvpState.success ? "text-primary" : "text-destructive"}`}>
            {rsvpState.message}
          </p>
        ) : null}
      </div>

      {canManage ? (
        <div className="space-y-4 border-t pt-4">
          <p className="text-sm font-medium">Officer actions</p>
          <div className="flex flex-wrap gap-2">
            {(["cancelled", "completed"] as const).map((status) => (
              <form key={status} action={statusAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="status" value={status} />
                <Button type="submit" size="sm" variant="outline" disabled={statusPending}>
                  Mark {status}
                </Button>
              </form>
            ))}
          </div>
          {statusState?.message ? (
            <p className={`text-xs ${statusState.success ? "text-primary" : "text-destructive"}`}>
              {statusState.message}
            </p>
          ) : null}

          <EventAttendancePanel eventId={event.id} attendees={event.attendees} />
        </div>
      ) : null}
    </div>
  )
}

function EventAttendancePanel({
  eventId,
  attendees,
}: {
  eventId: string
  attendees: EventWithMeta["attendees"]
}) {
  const [state, action, pending] = useActionState(recordAttendance, undefined)

  if (!attendees.length) {
    return (
      <p className="text-sm text-muted-foreground">No RSVPs to check in yet.</p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Attendance</p>
      <ul className="space-y-2">
        {attendees.map((attendee) => (
          <li
            key={attendee.userId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
          >
            <div>
              <p className="font-medium">{attendee.fullName}</p>
              <p className="text-muted-foreground">
                RSVP: {attendee.rsvpStatus}
                {attendee.checkedInAt
                  ? ` · Checked in ${new Date(attendee.checkedInAt).toLocaleString()}`
                  : ""}
              </p>
            </div>
            {attendee.rsvpStatus === "going" && !attendee.checkedInAt ? (
              <form action={action}>
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="userId" value={attendee.userId} />
                <Button type="submit" size="sm" disabled={pending}>
                  Check in
                </Button>
              </form>
            ) : attendee.checkedInAt ? (
              <Badge variant="outline">Present</Badge>
            ) : null}
          </li>
        ))}
      </ul>
      {state?.message ? (
        <p className={`text-xs ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
    </div>
  )
}
