import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { VolunteerApprovalQueue } from "@/components/portal/volunteer-hours-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { canApproveVolunteerHours } from "@/lib/auth/dal"
import { getPendingVolunteerHoursForReviewer } from "@/lib/data/phase45"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Volunteer hour approvals",
  description: "Review and approve chapter volunteer hours.",
}

export default async function AdminVolunteerHoursPage() {
  const allowed = await canApproveVolunteerHours()
  if (!allowed) redirect("/dashboard")

  const hours = await getPendingVolunteerHoursForReviewer()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Volunteer hour approvals</h1>
        <p className="mt-2 text-muted-foreground">
          Approve or reject pending hours. Approved batches generate a certificate and
          PDF for the volunteer.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending queue</CardTitle>
          <CardDescription>
            Select entries to approve in batch, or reject individually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VolunteerApprovalQueue hours={hours} />
        </CardContent>
      </Card>
    </div>
  )
}
