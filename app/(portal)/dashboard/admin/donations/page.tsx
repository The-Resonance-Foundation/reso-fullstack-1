import type { Metadata } from "next"
import { redirect } from "next/navigation"
import {
  DonationSummaryCards,
  DonationsTable,
  ManualDonationForm,
} from "@/components/portal/donations-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { canManageDonations, canViewDonations } from "@/lib/auth/dal"
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
  const [donations, totals] = await Promise.all([
    getDonationsForAdmin({ limit: 50 }),
    getDonationTotalsForAdmin(),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Donations</h1>
        <p className="mt-2 text-muted-foreground">
          PayPal webhook donations and manual offline entries. v1 tracks
          organization-wide gifts only.
        </p>
      </div>

      <DonationSummaryCards totals={totals} />

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Record manual donation</CardTitle>
            <CardDescription>
              For checks, cash, or other offline gifts. Board and corporate officers only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ManualDonationForm />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Donation history</CardTitle>
          <CardDescription>Most recent 50 entries</CardDescription>
        </CardHeader>
        <CardContent>
          <DonationsTable donations={donations} />
        </CardContent>
      </Card>
    </div>
  )
}
