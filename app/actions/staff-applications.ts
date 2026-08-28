"use server"

import { revalidatePath } from "next/cache"
import { getProfile, verifySession } from "@/lib/auth/dal"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendNewApplicationAlertEmails } from "@/lib/email/lifecycle"
import {
  staffApplicationSchema,
  type StaffApplicationFormState,
} from "@/lib/validations/staff-applications"
import type { ApplicantType, AppRole } from "@/types/enums"
import { ROLE_LABELS } from "@/types/roles"

/** Positions only the board can grant — their applications alert the board. */
const BOARD_ONLY_POSITIONS: AppRole[] = ["chapter_president", "corporate_officer"]

export async function submitStaffApplication(
  _prev: StaffApplicationFormState,
  formData: FormData
): Promise<StaffApplicationFormState> {
  const type = String(formData.get("type") ?? "") as ApplicantType

  const raw = {
    type,
    chapterId: formData.get("chapterId") || undefined,
    message: formData.get("message") || undefined,
    instrument:
      type === "tutor" ? formData.get("instrument") : undefined,
    requestedRole:
      type === "officer" ? formData.get("requestedRole") : undefined,
  }

  const validated = staffApplicationSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const profile = await getProfile()
  const supabase = await getServerClientOrThrow()

  const requestedRole =
    validated.data.type === "officer" ? validated.data.requestedRole : null
  const positionLabel = requestedRole
    ? ROLE_LABELS[requestedRole]
    : validated.data.type

  let duplicateQuery = supabase
    .from("applicants")
    .select("id")
    .eq("converted_user_id", user.id)
    .eq("type", validated.data.type)
    .eq("stage", "applied")
  if (requestedRole) {
    duplicateQuery = duplicateQuery.eq("requested_role", requestedRole)
  }
  const { data: existing } = await duplicateQuery.maybeSingle()

  if (existing) {
    return {
      message: `You already have a pending ${positionLabel.toLowerCase()} application.`,
    }
  }

  const chapterId = validated.data.chapterId ?? null

  const payload = {
    type: validated.data.type,
    chapter_id: chapterId,
    full_name: profile?.full_name ?? user.email ?? "Applicant",
    email: user.email ?? "",
    phone: profile?.phone ?? null,
    message: validated.data.message ?? null,
    instrument:
      validated.data.type === "tutor" ? validated.data.instrument : null,
    requested_role: requestedRole,
    stage: "applied" as const,
    converted_user_id: user.id,
  }

  const { error } = await supabase.from("applicants").insert(payload)

  if (error) {
    return { message: error.message }
  }

  // Alert the people with the authority to grant the position: the board for
  // president and corporate officer requests, board plus program admins for
  // program administrator requests, and the chapter's leadership plus program
  // admins for everything chapter-scoped.
  const boardOnly = requestedRole
    ? BOARD_ONLY_POSITIONS.includes(requestedRole)
    : false
  try {
    const admin = createAdminClient()
    const reviewerRoleNames = boardOnly
      ? ["board_of_director"]
      : chapterId === null
        ? ["board_of_director", "program_administrator"]
        : ["chapter_president", "chapter_officer", "program_administrator"]
    const [{ data: reviewerRoles }, { data: chapterRow }] = await Promise.all([
      admin
        .from("user_roles")
        .select("user_id, role, chapter_id")
        .eq("status", "active")
        .in("role", reviewerRoleNames),
      chapterId
        ? admin.from("chapters").select("name").eq("id", chapterId).maybeSingle()
        : Promise.resolve({ data: null }),
    ])
    const reviewerIds = [
      ...new Set(
        (reviewerRoles ?? [])
          .filter(
            (r) =>
              !["chapter_president", "chapter_officer"].includes(r.role) ||
              r.chapter_id === chapterId
          )
          .map((r) => r.user_id)
      ),
    ].filter((id) => id !== user.id)
    if (reviewerIds.length) {
      const { data: reviewerProfiles } = await admin
        .from("profiles")
        .select("email")
        .in("id", reviewerIds)
      await sendNewApplicationAlertEmails({
        reviewerEmails: (reviewerProfiles ?? []).map((p) => p.email),
        applicantName: payload.full_name,
        applicantType: payload.type,
        positionLabel,
        chapterName: chapterRow?.name,
      })
    }
  } catch (alertError) {
    console.error("new-application reviewer alert", alertError)
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/applications")
  revalidatePath("/dashboard/applicants")

  return {
    success: true,
    message: boardOnly
      ? "Application submitted. The board of directors will review it."
      : chapterId === null
        ? "Application submitted. Program administrators will review it soon."
        : "Application submitted. Chapter officers will review it soon.",
  }
}
