"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  canManageChapterRoles,
  canManageChapters,
  verifySession,
} from "@/lib/auth/dal"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import { APP_ROLES, CHAPTER_STATUSES, type AppRole } from "@/types/enums"

export type AdminActionState =
  | { message?: string; success?: boolean; errors?: Record<string, string[] | undefined> }
  | undefined

const chapterSchema = z.object({
  name: z.string().min(2, "Name is required.").trim(),
  slug: z
    .string()
    .min(2, "Slug is required.")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens.")
    .trim(),
  city: z.string().trim().optional(),
  state: z.string().trim().max(2).optional(),
  status: z.enum(CHAPTER_STATUSES),
})

const assignRoleSchema = z.object({
  userId: z.uuid("Select a member."),
  role: z.enum(APP_ROLES),
  chapterId: z.string().optional(),
})

const ORG_ROLES: AppRole[] = [
  "board_of_director",
  "program_administrator",
  "corporate_officer",
]

const CHAPTER_SCOPED_ROLES: AppRole[] = [
  "student_parent",
  "tutor",
  "volunteer",
  "chapter_officer",
  "chapter_president",
]

export async function upsertChapter(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await verifySession()
  const allowed = await canManageChapters()
  if (!allowed) {
    return { message: "You are not authorized to manage chapters." }
  }

  const chapterId = String(formData.get("chapterId") ?? "")
  const validated = chapterSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    status: formData.get("status"),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await getServerClientOrThrow()
  const payload = {
    name: validated.data.name,
    slug: validated.data.slug,
    city: validated.data.city ?? null,
    state: validated.data.state ?? null,
    status: validated.data.status,
  }

  const { error } = chapterId
    ? await supabase.from("chapters").update(payload).eq("id", chapterId)
    : await supabase.from("chapters").insert(payload)

  if (error) {
    return { message: error.message }
  }

  revalidatePath("/dashboard/admin/chapters")
  return {
    success: true,
    message: chapterId ? "Chapter updated." : "Chapter created.",
  }
}

export async function assignUserRole(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await verifySession()

  const validated = assignRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
    chapterId: formData.get("chapterId") || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { role, userId } = validated.data
  const chapterId = validated.data.chapterId || null

  if (CHAPTER_SCOPED_ROLES.includes(role) && !chapterId) {
    return { message: "Chapter is required for this role." }
  }

  if (ORG_ROLES.includes(role) && chapterId) {
    return { message: "Organization roles cannot be tied to a chapter." }
  }

  const allowed = await canManageChapterRoles(chapterId ?? undefined, role)
  if (!allowed) {
    return { message: "You are not authorized to assign this role." }
  }

  const admin = createAdminClient()

  const { error } = await admin.from("user_roles").insert({
    user_id: userId,
    chapter_id: chapterId,
    role,
    status: "active",
  })

  if (error) {
    if (error.code === "23505") {
      return { message: "This user already has that role for the selected chapter." }
    }
    return { message: error.message }
  }

  await admin.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "role_changed",
    entity_type: "user_role",
    entity_id: userId,
    chapter_id: chapterId,
    summary: `Role ${role} assigned`,
    metadata: { user_id: userId, role, chapter_id: chapterId, change: "assigned" },
  })

  revalidatePath("/dashboard/admin/roles")
  return { success: true, message: "Role assigned successfully." }
}

export async function removeUserRole(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await verifySession()

  const userRoleId = String(formData.get("userRoleId") ?? "")
  if (!userRoleId) {
    return { message: "Missing role assignment." }
  }

  const supabase = await getServerClientOrThrow()
  const { data: roleRow, error: fetchError } = await supabase
    .from("user_roles")
    .select("id, user_id, chapter_id, role")
    .eq("id", userRoleId)
    .maybeSingle()

  if (fetchError || !roleRow) {
    return { message: "Role assignment not found or access denied." }
  }

  const allowed = await canManageChapterRoles(
    roleRow.chapter_id,
    roleRow.role as AppRole
  )
  if (!allowed) {
    return { message: "You are not authorized to remove this role." }
  }

  const admin = createAdminClient()
  const { error } = await admin.from("user_roles").delete().eq("id", userRoleId)

  if (error) {
    return { message: error.message }
  }

  await admin.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "role_changed",
    entity_type: "user_role",
    entity_id: roleRow.user_id,
    chapter_id: roleRow.chapter_id,
    summary: `Role ${roleRow.role} removed`,
    metadata: {
      user_id: roleRow.user_id,
      role: roleRow.role,
      chapter_id: roleRow.chapter_id,
      change: "removed",
    },
  })

  revalidatePath("/dashboard/admin/roles")
  revalidatePath("/dashboard/tutors")
  revalidatePath("/dashboard/volunteers")

  return { success: true, message: "Role removed." }
}
