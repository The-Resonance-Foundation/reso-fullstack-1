"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Recharts is by far the heaviest thing the portal loads (~370KB), and it is
 * only ever needed for a few panels. Loading it on demand keeps it off the
 * critical path, so the dashboard's numbers, queues, and actions are usable
 * while the charts arrive. Each chart reserves its final height so nothing
 * shifts when it lands.
 */

function ChartPlaceholder({ height }: { height: number }) {
  return <Skeleton className="w-full rounded-lg" style={{ height }} />
}

export const DonationsTrendChart = dynamic(
  () => import("./dashboard-charts").then((m) => m.DonationsTrendChart),
  { ssr: false, loading: () => <ChartPlaceholder height={250} /> }
)

export const LessonsPerWeekChart = dynamic(
  () => import("./dashboard-charts").then((m) => m.LessonsPerWeekChart),
  { ssr: false, loading: () => <ChartPlaceholder height={250} /> }
)

export const PracticeWeekChart = dynamic(
  () => import("./dashboard-charts").then((m) => m.PracticeWeekChart),
  { ssr: false, loading: () => <ChartPlaceholder height={180} /> }
)
