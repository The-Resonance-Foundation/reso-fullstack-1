import type { Metadata } from "next"
import { redirect } from "next/navigation"
import {
  VolunteerHourForm,
  VolunteerHoursList,
} from "@/components/portal/volunteer-hours-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { canLogVolunteerHours, getVolunteerChapterOptions } from "@/lib/auth/dal"
import { getVolunteerHoursForUser } from "@/lib/data/phase45"
import { routes } from "@/lib/routes"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Volunteer hours",
  description: "Log and track volunteer service hours.",
}

export default async function VolunteerHoursPage() {
  const allowed = await canLogVolunteerHours()
  if (!allowed) redirect("/dashboard")

  const [chapters, hours] = await Promise.all([
    getVolunteerChapterOptions(),
    getVolunteerHoursForUser(),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Volunteer hours</h1>
          <p className="mt-2 text-muted-foreground">
            Log teaching, event support, or admin work. Hours are reviewed by chapter
            officers before certificates are issued.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={routes.portal.volunteerCertificates}>My certificates</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Log hours</CardTitle>
          <CardDescription>Submit pending hours for chapter approval</CardDescription>
        </CardHeader>
        <CardContent>
          <VolunteerHourForm chapters={chapters} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your hours</CardTitle>
          <CardDescription>Pending entries can be removed until approved</CardDescription>
        </CardHeader>
        <CardContent>
          <VolunteerHoursList hours={hours} />
        </CardContent>
      </Card>
    </div>
  )
}
