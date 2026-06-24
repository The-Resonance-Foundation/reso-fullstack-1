import "server-only"

import { roleForApplicant } from "@/lib/auth/applicant-roles"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Applicant } from "@/types/database"
import type { AppRole } from "@/types/enums"

export { roleForApplicant } from "@/lib/auth/applicant-roles"

async function ensureUserRole(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  chapterId: string,
  role: AppRole
) {
  const { data: existing } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("chapter_id", chapterId)
    .eq("role", role)
    .maybeSingle()

  if (existing) return { ok: true as const }

  const { error } = await admin.from("user_roles").insert({
    user_id: userId,
    chapter_id: chapterId,
    role,
    status: "active",
  })

  if (error) {
    if (error.code === "23505") return { ok: true as const }
    return { ok: false as const, message: error.message }
  }

  return { ok: true as const }
}

export type ProvisionResult =
  | { ok: true; userId: string; message: string }
  | { ok: false; message: string }

export async function provisionStaffApplicant(
  applicant: Applicant,
  reviewerId: string
): Promise<ProvisionResult> {
  if (!applicant.converted_user_id) {
    return {
      ok: false,
      message: "Applicant must have an existing portal account before acceptance.",
    }
  }

  const admin = createAdminClient()
  const userId = applicant.converted_user_id
  const role = roleForApplicant(applicant)

  const roleResult = await ensureUserRole(
    admin,
    userId,
    applicant.chapter_id,
    role
  )

  if (!roleResult.ok) {
    return { ok: false, message: roleResult.message }
  }

  const { error: updateError } = await admin
    .from("applicants")
    .update({
      stage: "active",
      reviewed_by: reviewerId,
    })
    .eq("id", applicant.id)

  if (updateError) {
    return { ok: false, message: updateError.message }
  }

  return {
    ok: true,
    userId,
    message: `Granted ${role.replaceAll("_", " ")} role to ${applicant.full_name}.`,
  }
}
