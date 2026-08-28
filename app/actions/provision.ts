"use server"

import { revalidatePath } from "next/cache"
import { canAssignRole, verifySession } from "@/lib/auth/dal"
import { provisionStaffApplicant, roleForApplicant } from "@/lib/auth/provision-helpers"
import { sendApplicantRejectionEmail } from "@/lib/email/applicant-rejection"
import { sendApplicantAcceptanceEmail } from "@/lib/email/lifecycle"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import type { Applicant } from "@/types/database"
import type { ApplicantType } from "@/types/enums"
import { ROLE_LABELS } from "@/types/roles"

export type ProvisionState =
  | { message?: string; success?: boolean }
  | undefined

const STAFF_TYPES: ApplicantType[] = ["tutor", "officer", "volunteer"]

export async function acceptAndProvisionApplicant(
  _prev: ProvisionState,
  formData: FormData
): Promise<ProvisionState> {
  const applicantId = String(formData.get("applicantId") ?? "")
  if (!applicantId) {
    return { message: "Missing applicant." }
  }

  const reviewer = await verifySession()
  const supabase = await getServerClientOrThrow()

  const { data: applicant, error: fetchError } = await supabase
    .from("applicants")
    .select("*")
    .eq("id", applicantId)
    .maybeSingle()

  if (fetchError || !applicant) {
    return { message: "Applicant not found or access denied." }
  }

  const record = applicant as Applicant
  // Deciding an application is granting the role, so it takes the same
  // authority: board-only for presidents and corporate officers, and so on.
  const allowed = await canAssignRole(roleForApplicant(record), record.chapter_id)
  if (!allowed) {
    return { message: "You are not authorized to review this applicant." }
  }

  if (!STAFF_TYPES.includes(record.type)) {
    return { message: "Only staff applications can be reviewed here." }
  }

  if (!record.converted_user_id) {
    return { message: "Applicant must have a portal account before acceptance." }
  }

  if (record.stage !== "applied") {
    return { message: "Applicant is not in a reviewable stage." }
  }

  const result = await provisionStaffApplicant(record, reviewer.id)

  if (!result.ok) {
    return { message: result.message }
  }

  const { data: chapterRow } = record.chapter_id
    ? await supabase.from("chapters").select("name").eq("id", record.chapter_id).maybeSingle()
    : { data: null }
  await sendApplicantAcceptanceEmail({
    to: record.email,
    fullName: record.full_name,
    applicantType: record.type,
    positionLabel:
      record.type === "officer" && record.requested_role
        ? ROLE_LABELS[record.requested_role]
        : null,
    chapterName: chapterRow?.name,
  })

  revalidatePath("/dashboard/applicants")
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/tutors")
  revalidatePath("/dashboard/volunteers")

  return { success: true, message: result.message }
}

export async function rejectApplicant(
  _prev: ProvisionState,
  formData: FormData
): Promise<ProvisionState> {
  const applicantId = String(formData.get("applicantId") ?? "")
  if (!applicantId) {
    return { message: "Missing applicant." }
  }

  const reviewer = await verifySession()
  const supabase = await getServerClientOrThrow()

  const { data: applicant, error: fetchError } = await supabase
    .from("applicants")
    .select("*, chapters(name)")
    .eq("id", applicantId)
    .maybeSingle()

  if (fetchError || !applicant) {
    return { message: "Applicant not found or access denied." }
  }

  const record = applicant as Applicant & { chapters?: { name: string } | null }
  const allowed = await canAssignRole(roleForApplicant(record), record.chapter_id)
  if (!allowed) {
    return { message: "You are not authorized to review this applicant." }
  }

  if (!STAFF_TYPES.includes(record.type)) {
    return { message: "Only staff applications can be reviewed here." }
  }

  if (record.stage !== "applied") {
    return { message: "Applicant is not in a rejectable stage." }
  }

  const { error: updateError } = await supabase
    .from("applicants")
    .update({
      stage: "rejected",
      reviewed_by: reviewer.id,
    })
    .eq("id", record.id)

  if (updateError) {
    return { message: updateError.message }
  }

  const emailResult = await sendApplicantRejectionEmail({
    to: record.email,
    fullName: record.full_name,
    applicantType: record.type,
    chapterName: record.chapters?.name,
  })

  revalidatePath("/dashboard/applicants")
  revalidatePath("/dashboard")

  if (!emailResult.sent) {
    return {
      success: true,
      message: `Applicant rejected. Email was not sent (${emailResult.reason}).`,
    }
  }

  return {
    success: true,
    message: `Rejection email sent to ${record.email}.`,
  }
}
