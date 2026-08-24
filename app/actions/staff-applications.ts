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
import type { ApplicantType } from "@/types/enums"

export async function submitStaffApplication(
  _prev: StaffApplicationFormState,
  formData: FormData
): Promise<StaffApplicationFormState> {
  const type = String(formData.get("type") ?? "") as ApplicantType

  const raw = {
    type,
    chapterId: formData.get("chapterId"),
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

  const { data: existing } = await supabase
    .from("applicants")
    .select("id")
    .eq("converted_user_id", user.id)
    .eq("type", validated.data.type)
    .eq("stage", "applied")
    .maybeSingle()

  if (existing) {
    return {
      message: `You already have a pending ${validated.data.type} application.`,
    }
  }

  const payload = {
    type: validated.data.type,
    chapter_id: validated.data.chapterId,
    full_name: profile?.full_name ?? user.email ?? "Applicant",
    email: user.email ?? "",
    phone: profile?.phone ?? null,
    message: validated.data.message ?? null,
    instrument:
      validated.data.type === "tutor" ? validated.data.instrument : null,
    requested_role:
      validated.data.type === "officer" ? validated.data.requestedRole : null,
    stage: "applied" as const,
    converted_user_id: user.id,
  }

  const { error } = await supabase.from("applicants").insert(payload)

  if (error) {
    return { message: error.message }
  }

  // Alert the people who will review it: this chapter's leadership plus
  // program administrators.
  try {
    const admin = createAdminClient()
    const [{ data: reviewerRoles }, { data: chapterRow }] = await Promise.all([
      admin
        .from("user_roles")
        .select("user_id, role, chapter_id")
        .eq("status", "active")
        .in("role", ["chapter_president", "chapter_officer", "program_administrator"]),
      admin.from("chapters").select("name").eq("id", validated.data.chapterId).maybeSingle(),
    ])
    const reviewerIds = [
      ...new Set(
        (reviewerRoles ?? [])
          .filter(
            (r) =>
              r.role === "program_administrator" ||
              r.chapter_id === validated.data.chapterId
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
        chapterName: chapterRow?.name,
      })
    }
  } catch (alertError) {
    console.error("new-application reviewer alert", alertError)
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/applicants")

  return {
    success: true,
    message: "Application submitted. Chapter officers will review it soon.",
  }
}
