import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Award, CheckCircle2, Clock, XCircle } from "lucide-react"
import { PageHeader } from "@/components/portal/page-header"
import { StatCard } from "@/components/portal/dashboard/stat-card"
import {
  VolunteerHourForm,
  VolunteerHoursList,
} from "@/components/portal/volunteer-hours-panel"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { canLogVolunteerHours, getVolunteerChapterOptions } from "@/lib/auth/dal"
import { getVolunteerHoursForUser } from "@/lib/data/phase45"
import { sumVolunteerHours } from "@/lib/volunteer/helpers"
import { routes } from "@/lib/routes"

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

  // Stat tiles are derived client/server-side from the rows this page already
  // loads via getVolunteerHoursForUser — no extra queries needed.
  const currentYear = String(new Date().getFullYear())
  const approvedThisYear = hours.filter(
    (h) => h.status === "approved" && h.activity_date.startsWith(currentYear)
  )
  const pending = hours.filter((h) => h.status === "pending")
  const rejected = hours.filter((h) => h.status === "rejected")

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        title="Volunteer hours"
        description="Log teaching, event support, or admin work. Hours are reviewed by chapter officers before certificates are issued."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={routes.portal.volunteerCertificates}>
              <Award aria-hidden />
              My certificates
            </Link>
          </Button>
        }
      />

      <section aria-label="Hours overview" className="grid gap-4 sm:grid-cols-3">
        <StatCard
          index={0}
          label="Approved this year"
          value={Math.round(sumVolunteerHours(approvedThisYear))}
          icon={<CheckCircle2 aria-hidden />}
        />
        <StatCard
          index={1}
          label="Pending"
          value={pending.length}
          icon={<Clock aria-hidden />}
        />
        <StatCard
          index={2}
          label="Rejected"
          value={rejected.length}
          icon={<XCircle aria-hidden />}
        />
      </section>

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
          <CardDescription>Pending entries can be edited or removed until approved</CardDescription>
        </CardHeader>
        <CardContent>
          <VolunteerHoursList hours={hours} />
        </CardContent>
      </Card>
    </div>
  )
}
