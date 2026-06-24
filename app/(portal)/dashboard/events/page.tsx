import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { EventForm, EventsList } from "@/components/portal/events-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { canManageEvents, canAccessPortalFeatures } from "@/lib/auth/dal"
import { getAllChapters } from "@/lib/auth/dal"
import { getEventsForManager, getEventsForUser } from "@/lib/data/phase23"

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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Events</h1>
        <p className="mt-2 text-muted-foreground">
          Recitals, meetings, and chapter gatherings.
        </p>
      </div>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Create event</CardTitle>
          </CardHeader>
          <CardContent>
            <EventForm chapters={chapters} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{canManage ? "All events" : "Upcoming events"}</CardTitle>
        </CardHeader>
        <CardContent>
          <EventsList events={events} />
        </CardContent>
      </Card>
    </div>
  )
}
