"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { getProfile, getUserRoles, verifySession } from "@/lib/auth/dal"
import { sendRoleGrantedEmail } from "@/lib/email/lifecycle"
import { createAdminClient } from "@/lib/supabase/admin"
import { ROLE_LABELS } from "@/types/roles"
import { routes } from "@/lib/routes"

export type AccountActionState =
  | { message?: string; success?: boolean; errors?: Record<string, string[] | undefined> }
  | undefined

const noteSchema = z.object({
  note: z
    .string()
    .trim()
    .max(500, "Keep the note under 500 characters.")
    .optional(),
})

/**
 * Guests leave a short note that appears under their name in the admin
 * members list, so the board knows which role to assign when onboarding
 * someone who did not go through an application (an existing officer, say).
 */
export async function updateOnboardingNote(
  _prev: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const user = await verifySession()

  const validated = noteSchema.safeParse({
    note: formData.get("note") || undefined,
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from("profiles")
    .update({ onboarding_note: validated.data.note || null })
    .eq("id", user.id)

  if (error) {
    return { message: error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/admin/roles")

  return {
    success: true,
    message: validated.data.note
      ? "Note saved. Administrators will see it next to your name."
      : "Note cleared.",
  }
}

const transferSchema = z.object({
  chapterId: z.uuid({ error: "Please select a chapter." }),
})

/**
 * A guest converts their account into a parent (family) account for a chosen
 * chapter. Mirrors the /join family signup path, which self-assigns the
 * student_parent role at account creation — this is the same trust level,
 * just for people who created a plain account first. Guests only: anyone
 * holding a role already must go through an administrator.
 */
export async function transferToParentAccount(
  _prev: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const user = await verifySession()

  const validated = transferSchema.safeParse({
    chapterId: formData.get("chapterId"),
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const roles = await getUserRoles()
  if (roles.length > 0) {
    return {
      message:
        "Your account already has a role. Ask an administrator to add the parent role instead.",
    }
  }

  const admin = createAdminClient()

  const { data: chapter } = await admin
    .from("chapters")
    .select("id, name")
    .eq("id", validated.data.chapterId)
    .eq("status", "active")
    .maybeSingle()

  if (!chapter) {
    return { message: "That chapter is not available." }
  }

  const { error } = await admin.from("user_roles").insert({
    user_id: user.id,
    chapter_id: chapter.id,
    role: "student_parent",
    status: "active",
  })

  if (error && error.code !== "23505") {
    return { message: error.message }
  }

  await admin.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "role_changed",
    entity_type: "user_role",
    entity_id: user.id,
    chapter_id: chapter.id,
    summary: "Guest transferred to a parent account",
    metadata: {
      user_id: user.id,
      role: "student_parent",
      chapter_id: chapter.id,
      change: "assigned",
    },
  })

  const profile = await getProfile()
  await sendRoleGrantedEmail({
    to: user.email,
    fullName: profile?.full_name ?? "there",
    roleLabel: ROLE_LABELS.student_parent,
    chapterName: chapter.name,
  })

  revalidatePath("/dashboard")
  redirect(routes.portal.students)
}
