import "server-only"

import { provisionStaffApplicant } from "@/lib/auth/provision-helpers"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Applicant } from "@/types/database"
import type { ApplicantType } from "@/types/enums"

const STAFF_TYPES: ApplicantType[] = ["tutor", "officer", "volunteer"]

/** Activates legacy applicant rows still in the accepted stage (pre-redesign invites). */
export async function activateAcceptedApplicants(userId: string) {
  const admin = createAdminClient()

  const { data: pending, error } = await admin
    .from("applicants")
    .select("*")
    .eq("converted_user_id", userId)
    .eq("stage", "accepted")

  if (error || !pending?.length) return

  for (const row of pending) {
    const applicant = row as Applicant

    if (STAFF_TYPES.includes(applicant.type)) {
      const result = await provisionStaffApplicant(
        applicant,
        applicant.reviewed_by ?? userId
      )
      if (!result.ok) {
        console.error("activateAcceptedApplicants provision", result.message)
      }
      continue
    }

    const { error: updateError } = await admin
      .from("applicants")
      .update({ stage: "active" })
      .eq("id", applicant.id)

    if (updateError) {
      console.error("activateAcceptedApplicants update", updateError.message)
    }
  }
}
