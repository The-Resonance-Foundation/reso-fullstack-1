import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { CalendarView } from "@/components/portal/calendar-view"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { canAccessPortalFeatures } from "@/lib/auth/dal"
import { getCalendarItems } from "@/lib/data/phase23"

export const metadata: Metadata = {
  title: "Calendar",
  description: "Lessons and events in one view.",
}

export default async function CalendarPage() {
  const allowed = await canAccessPortalFeatures()
  if (!allowed) redirect("/dashboard")

  const items = await getCalendarItems()

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Calendar</h1>
        <p className="mt-2 text-muted-foreground">
          Lessons and chapter events you can access.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarView items={items} />
        </CardContent>
      </Card>
    </div>
  )
}
