import type { Metadata } from "next"
import { Coins, Receipt, TrendingUp } from "lucide-react"
import { DonationsTrendChart } from "@/components/portal/dashboard/dashboard-charts"
import { StatCard } from "@/components/portal/dashboard/stat-card"
import { redirect } from "next/navigation"
import {
  DonationsDataTable,
  RecordDonationDialog,
} from "@/components/portal/donations-panel"
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { canManageDonations, canViewDonations } from "@/lib/auth/dal"
import { getDonationSeries } from "@/lib/data/dashboard"
import { getDonationTotalsForAdmin, getDonationsForAdmin } from "@/lib/data/phase6"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Donations",
  description: "Organization donation tracking.",
}

export default async function AdminDonationsPage() {
  const allowed = await canViewDonations()
  if (!allowed) redirect("/dashboard")

  const canManage = await canManageDonations()
  const [donations, totals, donationSeries] = await Promise.all([
    getDonationsForAdmin({ limit: 50 }),
    getDonationTotalsForAdmin(),
    getDonationSeries(12),
  ])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Donations"
        description="PayPal webhook donations and manual offline entries. v1 tracks organization-wide gifts only."
        actions={canManage ? <RecordDonationDialog /> : null}
      />

      <section aria-label="Donation metrics" className="grid gap-4 sm:grid-cols-3">
        <StatCard
          index={0}
          label="Total raised"
          value={Math.round(totals.totalAmount)}
          format="currency"
          icon={<Coins aria-hidden />}
        />
        <StatCard
          index={1}
          label="Donations count"
          value={totals.completedCount}
          icon={<Receipt aria-hidden />}
          hint="Completed gifts, all time"
        />
        <StatCard
          index={2}
          label="Last 30 days"
          value={Math.round(totals.last30DaysAmount)}
          format="currency"
          icon={<TrendingUp aria-hidden />}
        />
      </section>

      {donationSeries.length ? (
        <Card className="animate-fade-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly trend</CardTitle>
            <CardDescription>Last 12 months</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <DonationsTrendChart data={donationSeries} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Donation history</CardTitle>
          <CardDescription>Most recent {donations.length} entries</CardDescription>
        </CardHeader>
        <CardContent>
          <DonationsDataTable donations={donations} />
        </CardContent>
      </Card>
    </div>
  )
}
