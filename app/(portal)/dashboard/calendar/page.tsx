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

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const from = new Date(startOfMonth)
  from.setMonth(from.getMonth() - 2)
  const to = new Date(startOfMonth)
  to.setMonth(to.getMonth() + 4)

  const items = await getCalendarItems({
    from: from.toISOString(),
    to: to.toISOString(),
  })

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
