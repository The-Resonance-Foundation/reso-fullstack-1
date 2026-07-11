import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Clock, ClipboardList, Users } from "lucide-react"
import { PageHeader } from "@/components/portal/page-header"
import { StatCard } from "@/components/portal/dashboard/stat-card"
import { VolunteerApprovalQueue } from "@/components/portal/volunteer-approval-queue"
import { canApproveVolunteerHours } from "@/lib/auth/dal"
import { getPendingVolunteerHoursForReviewer } from "@/lib/data/phase45"
import { sumVolunteerHours } from "@/lib/volunteer/helpers"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Volunteer hour approvals",
  description: "Review and approve chapter volunteer hours.",
}

export default async function AdminVolunteerHoursPage() {
  const allowed = await canApproveVolunteerHours()
  if (!allowed) redirect("/dashboard")

  const hours = await getPendingVolunteerHoursForReviewer()

  // getPendingVolunteerHoursForReviewer only returns pending rows, so the
  // tiles below are derived from that same set rather than a new query.
  const pendingHoursTotal = sumVolunteerHours(hours)
  const volunteersWaiting = new Set(hours.map((h) => h.user_id)).size

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Volunteer hour approvals"
        description="Approve or reject pending hours. Approved batches generate a certificate and PDF for the volunteer."
      />

      <section aria-label="Queue overview" className="grid gap-4 sm:grid-cols-3">
        <StatCard
          index={0}
          label="Pending requests"
          value={hours.length}
          icon={<ClipboardList aria-hidden />}
        />
        <StatCard
          index={1}
          label="Pending hours"
          value={Math.round(pendingHoursTotal)}
          icon={<Clock aria-hidden />}
        />
        <StatCard
          index={2}
          label="Volunteers waiting"
          value={volunteersWaiting}
          icon={<Users aria-hidden />}
        />
      </section>

      <VolunteerApprovalQueue hours={hours} />
    </div>
  )
}
