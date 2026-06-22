"use server"

import { revalidatePath } from "next/cache"
import {
  canReviewApplicants,
  verifySession,
} from "@/lib/auth/dal"
import { roleForApplicant } from "@/lib/auth/provision-helpers"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import type { Applicant } from "@/types/database"

export type MemberActionState =
  | { message?: string; success?: boolean }
  | undefined

async function loadApplicant(applicantId: string) {
  const supabase = await getServerClientOrThrow()
  const { data: applicant, error } = await supabase
    .from("applicants")
    .select("*")
    .eq("id", applicantId)
    .maybeSingle()

  if (error || !applicant) return null

  const record = applicant as Applicant
  const allowed = await canReviewApplicants(record.chapter_id)
  if (!allowed) return null

  return record
}

async function deleteAuthUserIfOrphaned(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: remainingRoles } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)

  if (remainingRoles?.length) return

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) throw new Error(error.message)
}

export async function deleteApplicant(
  _prev: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const applicantId = String(formData.get("applicantId") ?? "")
  if (!applicantId) {
    return { message: "Missing applicant." }
  }

  await verifySession()
  const record = await loadApplicant(applicantId)
  if (!record) {
    return { message: "Applicant not found or access denied." }
  }

  const admin = createAdminClient()

  if (record.converted_user_id && record.stage === "active") {
    const role = roleForApplicant(record)

    const { error: roleError } = await admin
      .from("user_roles")
      .delete()
      .eq("user_id", record.converted_user_id)
      .eq("chapter_id", record.chapter_id)
      .eq("role", role)

    if (roleError) {
      return { message: roleError.message }
    }

    try {
      await deleteAuthUserIfOrphaned(admin, record.converted_user_id)
    } catch (error) {
      return {
        message:
          error instanceof Error ? error.message : "Could not remove member account.",
      }
    }
  }

  const { error: deleteError } = await admin
    .from("applicants")
    .delete()
    .eq("id", record.id)

  if (deleteError) {
    return { message: deleteError.message }
  }

  revalidatePath("/dashboard/applicants")
  revalidatePath("/dashboard/tutors")
  revalidatePath("/dashboard/volunteers")
  revalidatePath("/dashboard")

  return {
    success: true,
    message: `Deleted application for ${record.full_name}.`,
  }
}

export async function deleteTutor(
  _prev: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const userRoleId = String(formData.get("userRoleId") ?? "")
  if (!userRoleId) {
    return { message: "Missing tutor." }
  }

  const reviewer = await verifySession()
  return deleteChapterMemberByRole(userRoleId, "tutor", reviewer.id)
}

async function deleteChapterMemberByRole(
  userRoleId: string,
  expectedRole: "tutor" | "volunteer",
  reviewerId: string
): Promise<MemberActionState> {
  const supabase = await getServerClientOrThrow()

  const { data: roleRow, error: fetchError } = await supabase
    .from("user_roles")
    .select("id, user_id, chapter_id, role")
    .eq("id", userRoleId)
    .maybeSingle()

  if (fetchError || !roleRow) {
    return { message: `${expectedRole} not found or access denied.` }
  }

  if (roleRow.role !== expectedRole) {
    return { message: `This member is not a ${expectedRole}.` }
  }

  if (!roleRow.chapter_id) {
    return { message: "Chapter is missing." }
  }

  const allowed = await canReviewApplicants(roleRow.chapter_id)
  if (!allowed) {
    return { message: `You are not authorized to remove this ${expectedRole}.` }
  }

  if (roleRow.user_id === reviewerId) {
    return { message: "You cannot delete your own account from here." }
  }

  const admin = createAdminClient()
  const userId = roleRow.user_id
  const chapterId = roleRow.chapter_id
  const applicantType = expectedRole === "tutor" ? "tutor" : "volunteer"

  const { error: roleError } = await admin
    .from("user_roles")
    .delete()
    .eq("id", userRoleId)

  if (roleError) {
    return { message: roleError.message }
  }

  const { error: applicantError } = await admin
    .from("applicants")
    .delete()
    .eq("converted_user_id", userId)
    .eq("type", applicantType)
    .eq("chapter_id", chapterId)

  if (applicantError) {
    return { message: applicantError.message }
  }

  try {
    await deleteAuthUserIfOrphaned(admin, userId)
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : `Could not remove ${expectedRole} account.`,
    }
  }

  revalidatePath(`/dashboard/${expectedRole}s`)
  revalidatePath("/dashboard/applicants")
  revalidatePath("/dashboard")

  return { success: true, message: `${expectedRole} removed from the database.` }
}

export async function deleteVolunteer(
  _prev: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const userRoleId = String(formData.get("userRoleId") ?? "")
  if (!userRoleId) {
    return { message: "Missing volunteer." }
  }

  const reviewer = await verifySession()
  return deleteChapterMemberByRole(userRoleId, "volunteer", reviewer.id)
}
