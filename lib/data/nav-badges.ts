import "server-only"

import { cache } from "react"
import { canReviewApplicants } from "@/lib/auth/dal"
import { getServerClientOrThrow } from "@/lib/supabase/server"

/**
 * Pending-work counts surfaced as badges on the reviewer nav items.
 * Keys match nav item labels. RLS scopes each count to the caller.
 */
export const getNavBadges = cache(async (): Promise<Record<string, number>> => {
  const canReview = await canReviewApplicants()
  if (!canReview) return {}
  const supabase = await getServerClientOrThrow()
  const [applicants, students, hours] = await Promise.all([
    supabase
      .from("applicants")
      .select("*", { count: "exact", head: true })
      .eq("stage", "applied"),
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("volunteer_hours")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ])
  const badges: Record<string, number> = {}
  if (applicants.count) badges["Applicants"] = applicants.count
  if (students.count) badges["Families"] = students.count
  if (hours.count) badges["Volunteer Approvals"] = hours.count
  return badges
})
