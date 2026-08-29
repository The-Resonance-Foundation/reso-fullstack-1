import type { Metadata } from "next"
import { Coins, Receipt, TrendingUp } from "lucide-react"
import { DonationsTrendChart } from "@/components/portal/dashboard/lazy-charts"
import { StatCard } from "@/components/portal/dashboard/stat-card"
import { redirect } from "next/navigation"
import {
  DonationsDataTable,
  RecordDonationDialog,
} from "@/components/portal/donations-panel"
import { ExportCsvButton } from "@/components/portal/export-csv-button"
import { PageHeader } from "@/components/portal/page-header"
import { PaginationBar } from "@/components/portal/pagination-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { canManageDonations, canViewDonations } from "@/lib/auth/dal"
import { getDonationSeries } from "@/lib/data/dashboard"
import { getDonationTotalsForAdmin, getDonationsForAdmin } from "@/lib/data/phase6"
import { routes } from "@/lib/routes"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 50

export const metadata: Metadata = {
  title: "Donations",
  description: "Organization donation tracking.",
}

export default async function AdminDonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const allowed = await canViewDonations()
  if (!allowed) redirect("/dashboard")

  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1)

  const canManage = await canManageDonations()
  const [fetched, totals, donationSeries] = await Promise.all([
    // One extra row detects whether an older page exists.
    getDonationsForAdmin({ limit: PAGE_SIZE + 1, offset: (page - 1) * PAGE_SIZE }),
    getDonationTotalsForAdmin(),
    getDonationSeries(12),
  ])
  const hasMore = fetched.length > PAGE_SIZE
  const donations = fetched.slice(0, PAGE_SIZE)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Donations"
        description="PayPal webhook donations and manual offline entries. v1 tracks organization-wide gifts only."
        actions={
          <div className="flex items-center gap-2">
            <ExportCsvButton dataset="donations" />
            {canManage ? <RecordDonationDialog /> : null}
          </div>
        }
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
          <PaginationBar
            page={page}
            hasMore={hasMore}
            basePath={routes.portal.admin.donations}
          />
        </CardContent>
      </Card>
    </div>
  )
}
