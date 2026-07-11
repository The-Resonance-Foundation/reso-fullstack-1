import type { Metadata } from "next"
import { redirect } from "next/navigation"
import {
  CreateEventDialog,
  EventsList,
  type EventListItem,
} from "@/components/portal/events-panel"
import { PageHeader } from "@/components/portal/page-header"
import { canManageEvents, canAccessPortalFeatures, getAllChapters, verifySession } from "@/lib/auth/dal"
import { getEventsForManager, getEventsForUser } from "@/lib/data/phase23"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import type { RsvpStatus } from "@/types/enums"

export const metadata: Metadata = {
  title: "Events",
  description: "Chapter and organization events.",
}

export default async function EventsPage() {
  const [hasRole, canManage] = await Promise.all([
    canAccessPortalFeatures(),
    canManageEvents(),
  ])

  if (!hasRole) redirect("/dashboard")

  const [events, chapters] = await Promise.all([
    canManage ? getEventsForManager() : getEventsForUser(),
    canManage ? getAllChapters() : Promise.resolve([]),
  ])

  // Enrich the list with RSVP aggregates (going count + the viewer's own
  // status). RLS limits non-managers to their own rsvp row, which is
  // acceptable here — the same limitation already applies to the detail
  // page's capacity count.
  const eventIds = events.map((event) => event.id)
  const goingByEvent = new Map<string, number>()
  const userRsvpByEvent = new Map<string, RsvpStatus>()

  if (eventIds.length) {
    const [user, supabase] = await Promise.all([verifySession(), getServerClientOrThrow()])
    const { data: rsvpRows, error } = await supabase
      .from("event_rsvps")
      .select("event_id, user_id, status")
      .in("event_id", eventIds)

    if (error) {
      console.error("EventsPage rsvp aggregate", error.message)
    }

    for (const row of (rsvpRows ?? []) as {
      event_id: string
      user_id: string
      status: RsvpStatus
    }[]) {
      if (row.status === "going") {
        goingByEvent.set(row.event_id, (goingByEvent.get(row.event_id) ?? 0) + 1)
      }
      if (row.user_id === user.id) {
        userRsvpByEvent.set(row.event_id, row.status)
      }
    }
  }

  const eventItems: EventListItem[] = events.map((event) => ({
    ...event,
    goingCount: goingByEvent.get(event.id) ?? 0,
    userRsvpStatus: userRsvpByEvent.get(event.id) ?? null,
  }))

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Events"
        description="Recitals, meetings, and chapter gatherings."
        actions={canManage ? <CreateEventDialog chapters={chapters} /> : null}
      />

      <EventsList events={eventItems} canManage={canManage} />
    </div>
  )
}
