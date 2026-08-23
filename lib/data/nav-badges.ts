import "server-only"

import { cache } from "react"
import { canApproveVolunteerHours, canReviewApplicants } from "@/lib/auth/dal"
import { getPendingVolunteerHoursForReviewer } from "@/lib/data/phase45"
import { getServerClientOrThrow } from "@/lib/supabase/server"

/**
 * Pending-work counts surfaced as badges on the reviewer nav items.
 * Keys match nav item labels. RLS scopes each count to the caller.
 */
export const getNavBadges = cache(async (): Promise<Record<string, number>> => {
  const [canReview, canApproveHours] = await Promise.all([
    canReviewApplicants(),
    canApproveVolunteerHours(),
  ])
  if (!canReview && !canApproveHours) return {}

  const badges: Record<string, number> = {}

  if (canReview) {
    const supabase = await getServerClientOrThrow()
    const [applicants, students] = await Promise.all([
      supabase
        .from("applicants")
        .select("*", { count: "exact", head: true })
        .eq("stage", "applied"),
      supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ])
    if (applicants.count) badges["Applicants"] = applicants.count
    if (students.count) badges["Families"] = students.count
  }

  if (canApproveHours) {
    // Same scoping as the approvals queue itself (board = all incl. corporate,
    // program admin = chapter-level, president = own chapters).
    const hours = await getPendingVolunteerHoursForReviewer()
    if (hours.length) badges["Volunteer Approvals"] = hours.length
  }

  return badges
})
