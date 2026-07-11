"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import {
  CalendarDays,
  CalendarOff,
  Clock,
  MapPin,
  Plus,
  Users,
} from "lucide-react"
import {
  createEvent,
  recordAttendance,
  submitRsvp,
  updateEventStatus,
} from "@/app/actions/events"
import { FormFieldError } from "@/components/forms/form-field-error"
import { NativeSelect } from "@/components/forms/native-select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataTable } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn, initials } from "@/lib/utils"
import { routes } from "@/lib/routes"
import type { Chapter, Event } from "@/types/database"
import { EVENT_STATUSES, RSVP_STATUSES, type EventStatus, type RsvpStatus } from "@/types/enums"
import type { EventWithMeta } from "@/lib/data/phase23"
import { remainingEventCapacity } from "@/lib/events/helpers"
import type { EventFormState, RsvpFormState } from "@/lib/validations/phase23"

/** Event row enriched with RSVP aggregates the list page fetches separately. */
export type EventListItem = Event & {
  goingCount: number
  userRsvpStatus: RsvpStatus | null
}

const DAY_FMT = new Intl.DateTimeFormat("en-US", { day: "numeric" })
const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "short" })
const TIME_FMT = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" })
const FULL_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
})

function timeRange(startsAt: string, endsAt: string) {
  return `${TIME_FMT.format(new Date(startsAt))} – ${TIME_FMT.format(new Date(endsAt))}`
}

const RSVP_LABELS: Record<RsvpStatus, string> = {
  going: "Going",
  maybe: "Maybe",
  declined: "Can't go",
}

function EventStatusBadge({ status }: { status: EventStatus }) {
  if (status === "published") {
    return <Badge className="border-transparent bg-success/15 text-success">Published</Badge>
  }
  if (status === "cancelled") {
    return <Badge className="border-transparent bg-destructive/15 text-destructive">Cancelled</Badge>
  }
  if (status === "completed") {
    return <Badge variant="outline">Completed</Badge>
  }
  return <Badge variant="secondary">Draft</Badge>
}

function RsvpBadge({ status }: { status: RsvpStatus | null }) {
  if (!status) {
    return (
      <Badge variant="outline" className="font-normal text-muted-foreground">
        Not responded
      </Badge>
    )
  }
  if (status === "going") {
    return <Badge className="border-transparent bg-success/15 text-success">Going</Badge>
  }
  if (status === "maybe") {
    return (
      <Badge className="border-transparent bg-warning/15 text-warning-foreground dark:text-warning">
        Maybe
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="font-normal text-muted-foreground">
      Can&apos;t go
    </Badge>
  )
}

function DateTile({ iso }: { iso: string }) {
  const date = new Date(iso)
  return (
    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-muted/60">
      <span className="text-lg font-bold leading-none text-foreground">
        {DAY_FMT.format(date)}
      </span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {MONTH_FMT.format(date)}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create event dialog
// ---------------------------------------------------------------------------

export function EventForm({
  chapters,
  onSuccess,
}: {
  chapters: Chapter[]
  onSuccess?: () => void
}) {
  const [state, action, pending] = useActionState(
    async (prevState: EventFormState, formData: FormData) => {
      const result = await createEvent(prevState, formData)
      if (result?.success) {
        toast.success(result.message ?? "Event created.")
        onSuccess?.()
      } else if (result?.message) {
        toast.error(result.message)
      }
      return result
    },
    undefined
  )

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
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Creating…" : "Create event"}
      </Button>
    </form>
  )
}

export function CreateEventDialog({ chapters }: { chapters: Chapter[] }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus aria-hidden />
          Create event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create event</DialogTitle>
          <DialogDescription>
            Publish a recital, meeting, or chapter gathering.
          </DialogDescription>
        </DialogHeader>
        <EventForm chapters={chapters} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Events list — tabs + card grid
// ---------------------------------------------------------------------------

function EventCard({ event, index }: { event: EventListItem; index: number }) {
  const remaining = remainingEventCapacity(event.capacity, event.goingCount)
  const pct = event.capacity
    ? Math.min(100, Math.round((event.goingCount / event.capacity) * 100))
    : 0

  return (
    <Link
      href={`${routes.portal.events}/${event.id}`}
      className="animate-fade-up group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ "--stagger-index": index } as React.CSSProperties}
    >
      <div className="flex items-start gap-3">
        <DateTile iso={event.starts_at} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="truncate font-serif text-base font-semibold leading-tight">
            {event.title}
          </h3>
          <Badge variant="outline" className="font-normal text-muted-foreground">
            {event.chapters?.name ?? "Org-wide"}
          </Badge>
        </div>
      </div>

      <div className="space-y-1 text-sm text-muted-foreground">
        {event.location ? (
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{event.location}</span>
          </p>
        ) : null}
        <p className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {timeRange(event.starts_at, event.ends_at)}
        </p>
      </div>

      {event.capacity !== null ? (
        <div className="space-y-1">
          <Progress value={pct} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            {event.goingCount} of {event.capacity} going
            {remaining === 0 ? " · Full" : ""}
          </p>
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <EventStatusBadge status={event.status} />
        <RsvpBadge status={event.userRsvpStatus} />
      </div>
    </Link>
  )
}

function EventGrid({
  events,
  emptyTitle,
  emptyDescription,
}: {
  events: EventListItem[]
  emptyTitle: string
  emptyDescription: string
}) {
  if (!events.length) {
    return (
      <EmptyState
        icon={<CalendarOff aria-hidden />}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event, index) => (
        <EventCard key={event.id} event={event} index={index} />
      ))}
    </div>
  )
}

export function EventsList({
  events,
  canManage,
}: {
  events: EventListItem[]
  canManage: boolean
}) {
  // Captured once on mount so the upcoming/past split is stable across
  // re-renders (react-hooks/purity).
  const [now] = useState(() => Date.now())
  const drafts = events.filter((e) => e.status === "draft")
  const visible = canManage ? events.filter((e) => e.status !== "draft") : events

  const upcoming = visible
    .filter((e) => new Date(e.ends_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  const past = visible
    .filter((e) => new Date(e.ends_at).getTime() < now)
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())

  return (
    <Tabs defaultValue="upcoming" className="space-y-4">
      <TabsList>
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="past">Past</TabsTrigger>
        {canManage ? <TabsTrigger value="drafts">Drafts</TabsTrigger> : null}
      </TabsList>
      <TabsContent value="upcoming">
        <EventGrid
          events={upcoming}
          emptyTitle="No upcoming events"
          emptyDescription="Nothing on the calendar yet. Check back soon."
        />
      </TabsContent>
      <TabsContent value="past">
        <EventGrid
          events={past}
          emptyTitle="No past events"
          emptyDescription="Past recitals and gatherings will show up here."
        />
      </TabsContent>
      {canManage ? (
        <TabsContent value="drafts">
          <EventGrid
            events={drafts}
            emptyTitle="No drafts"
            emptyDescription="Draft events aren't visible to members until published."
          />
        </TabsContent>
      ) : null}
    </Tabs>
  )
}

// ---------------------------------------------------------------------------
// Event detail — hero, RSVP, capacity, manager tools
// ---------------------------------------------------------------------------

function RsvpSegmentedControl({
  eventId,
  currentStatus,
}: {
  eventId: string
  currentStatus: RsvpStatus | null
}) {
  const [, action, pending] = useActionState(
    async (prevState: RsvpFormState, formData: FormData) => {
      const result = await submitRsvp(prevState, formData)
      if (result?.success) {
        toast.success(result.message ?? "RSVP saved.")
      } else if (result?.message) {
        // Includes the friendly "event just filled up" message when the DB
        // capacity trigger rejects a "going" RSVP.
        toast.error(result.message)
      }
      return result
    },
    undefined
  )

  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-muted p-1">
      {RSVP_STATUSES.map((status) => (
        <form key={status} action={action}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="status" value={status} />
          <button
            type="submit"
            disabled={pending}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
              currentStatus === status
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
            )}
          >
            {RSVP_LABELS[status]}
          </button>
        </form>
      ))}
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
  const [, checkInAction, checkInPending] = useActionState(
    async (prevState: EventFormState, formData: FormData) => {
      const result = await recordAttendance(prevState, formData)
      if (result?.success) {
        toast.success(result.message ?? "Attendance recorded.")
      } else if (result?.message) {
        toast.error(result.message)
      }
      return result
    },
    undefined
  )

  type Attendee = EventWithMeta["attendees"][number]

  const columns = useMemo<ColumnDef<Attendee>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">
                {initials(row.original.fullName)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{row.original.fullName}</span>
          </div>
        ),
      },
      {
        accessorKey: "rsvpStatus",
        header: "RSVP",
        cell: ({ row }) => <RsvpBadge status={row.original.rsvpStatus} />,
      },
      {
        id: "checkIn",
        header: "Check-in",
        cell: ({ row }) => {
          const attendee = row.original
          if (attendee.checkedInAt) {
            return (
              <Badge className="border-transparent bg-success/15 text-success">
                Checked in {new Date(attendee.checkedInAt).toLocaleDateString()}
              </Badge>
            )
          }
          if (attendee.rsvpStatus !== "going") {
            return <span className="text-sm text-muted-foreground">—</span>
          }
          return (
            <form action={checkInAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="userId" value={attendee.userId} />
              <Button type="submit" size="sm" variant="outline" disabled={checkInPending}>
                Check in
              </Button>
            </form>
          )
        },
      },
    ],
    [checkInAction, checkInPending, eventId]
  )

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">Attendees</h4>
      <DataTable
        columns={columns}
        data={attendees}
        searchPlaceholder="Search attendees…"
        emptyState={
          <EmptyState
            icon={<Users aria-hidden />}
            title="No RSVPs yet"
            description="Attendees will show up here once members RSVP."
          />
        }
      />
    </div>
  )
}

function EventManagerSection({ event }: { event: EventWithMeta }) {
  const [statusPending, setStatusPending] = useState(false)

  async function changeStatus(status: "published" | "cancelled" | "completed") {
    setStatusPending(true)
    try {
      const formData = new FormData()
      formData.set("eventId", event.id)
      formData.set("status", status)
      const result = await updateEventStatus(undefined, formData)
      if (result?.success) {
        toast.success(result.message ?? "Event updated.")
      } else {
        toast.error(result?.message ?? "Couldn't update the event.")
      }
    } finally {
      setStatusPending(false)
    }
  }

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <h3 className="text-sm font-semibold">Officer actions</h3>
      <div className="flex flex-wrap gap-2">
        {event.status === "draft" ? (
          <ConfirmDialog
            trigger={<Button size="sm" disabled={statusPending}>Publish event</Button>}
            title="Publish this event?"
            description="Members will be able to see it on the events list and RSVP once it's published."
            confirmLabel="Publish"
            destructive={false}
            onConfirm={() => changeStatus("published")}
          />
        ) : null}
        {event.status === "published" ? (
          <ConfirmDialog
            trigger={
              <Button size="sm" variant="outline" disabled={statusPending}>
                Mark completed
              </Button>
            }
            title="Mark this event completed?"
            description="Use this once the event has taken place. It will move to the past events list."
            confirmLabel="Mark completed"
            destructive={false}
            onConfirm={() => changeStatus("completed")}
          />
        ) : null}
        {event.status !== "cancelled" && event.status !== "completed" ? (
          <ConfirmDialog
            trigger={
              <Button size="sm" variant="outline" disabled={statusPending}>
                Cancel event
              </Button>
            }
            title="Cancel this event?"
            description="Attendees will see this event marked cancelled. You can't undo this from here."
            confirmLabel="Cancel event"
            onConfirm={() => changeStatus("cancelled")}
          />
        ) : null}
      </div>

      <EventAttendancePanel eventId={event.id} attendees={event.attendees} />
    </div>
  )
}

export function EventDetailPanel({
  event,
  canManage,
}: {
  event: EventWithMeta
  canManage: boolean
}) {
  const remaining = remainingEventCapacity(event.capacity, event.goingCount)
  const pct = event.capacity
    ? Math.min(100, Math.round((event.goingCount / event.capacity) * 100))
    : 0

  return (
    <div className="space-y-6">
      <div className="animate-fade-up space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <EventStatusBadge status={event.status} />
          <Badge variant="outline" className="font-normal text-muted-foreground">
            {event.chapters?.name ?? "Organization-wide"}
          </Badge>
        </div>
        <h1 className="font-serif text-2xl font-bold sm:text-3xl">{event.title}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" aria-hidden />
            {FULL_DATE_FMT.format(new Date(event.starts_at))}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden />
            {timeRange(event.starts_at, event.ends_at)}
          </span>
          {event.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" aria-hidden />
              {event.location}
            </span>
          ) : null}
        </div>
        {event.description ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {event.description}
          </p>
        ) : null}
      </div>

      {event.capacity !== null ? (
        <div className="animate-fade-up space-y-1.5 rounded-lg border border-border bg-muted/40 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Capacity</span>
            <span className="text-muted-foreground">
              {event.goingCount} of {event.capacity} going
              {remaining === 0 ? " · Full" : ""}
            </span>
          </div>
          <Progress value={pct} />
        </div>
      ) : null}

      <div className="animate-fade-up space-y-2">
        <p className="text-sm font-medium">Your RSVP</p>
        <RsvpSegmentedControl eventId={event.id} currentStatus={event.userRsvp?.status ?? null} />
      </div>

      {canManage ? <EventManagerSection event={event} /> : null}
    </div>
  )
}
