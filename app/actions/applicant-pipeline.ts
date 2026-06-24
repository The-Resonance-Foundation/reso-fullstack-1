"use server"

import { revalidatePath } from "next/cache"
import { canReviewApplicants, verifySession } from "@/lib/auth/dal"
import { isValidApplicantStageTransition } from "@/lib/events/helpers"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import type { Applicant } from "@/types/database"
import {
  applicantStageSchema,
  type ApplicantStageFormState,
} from "@/lib/validations/phase23"

export async function updateApplicantStage(
  _prev: ApplicantStageFormState,
  formData: FormData
): Promise<ApplicantStageFormState> {
  const validated = applicantStageSchema.safeParse({
    applicantId: formData.get("applicantId"),
    stage: formData.get("stage"),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  await verifySession()
  const supabase = await getServerClientOrThrow()

  const { data: applicant } = await supabase
    .from("applicants")
    .select("*")
    .eq("id", validated.data.applicantId)
    .maybeSingle()

  if (!applicant) {
    return { message: "Applicant not found." }
  }

  const record = applicant as Applicant
  const allowed = await canReviewApplicants(record.chapter_id)
  if (!allowed) {
    return { message: "You are not authorized to update this applicant." }
  }

  if (!isValidApplicantStageTransition(record.stage, validated.data.stage)) {
    return {
      message: `Cannot move applicant from ${record.stage} to ${validated.data.stage}.`,
    }
  }

  const { error } = await supabase
    .from("applicants")
    .update({ stage: validated.data.stage })
    .eq("id", validated.data.applicantId)

  if (error) {
    return { message: error.message }
  }

  revalidatePath("/dashboard/applicants")
  return { success: true, message: `Applicant moved to ${validated.data.stage}.` }
}
