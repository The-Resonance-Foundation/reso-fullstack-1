"use server"

import { verifySession, getUserRoles } from "@/lib/auth/dal"
import { canManageChapter, isBoard } from "@/types/enums"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import { revalidateMessagingPaths } from "@/lib/portal/revalidate-messaging"
import {
  announcementSchema,
  type AnnouncementFormState,
} from "@/lib/validations/phase45"

export async function publishAnnouncement(
  _prev: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const validated = announcementSchema.safeParse({
    chapterId: formData.get("chapterId") || undefined,
    title: formData.get("title"),
    body: formData.get("body"),
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const chapterId = validated.data.chapterId || null
  const roles = await getUserRoles()
  const roleNames = roles.map((r) => r.role)

  if (chapterId) {
    const allowed = await canManageChapter(roleNames, chapterId, roles.map((r) => r.chapter_id))
    if (!allowed) return { message: "You cannot publish for this chapter." }
  } else if (!isBoard(roleNames)) {
    return { message: "Only the board can publish org-wide announcements." }
  }

  const supabase = await getServerClientOrThrow()
  const { data: announcement, error } = await supabase
    .from("announcements")
    .insert({
      chapter_id: chapterId,
      title: validated.data.title,
      body: validated.data.body,
      created_by: user.id,
    })
    .select("id")
    .single()

  if (error) return { message: error.message }

  const admin = createAdminClient()
  let memberQuery = admin.from("user_roles").select("user_id").eq("status", "active")
  if (chapterId) memberQuery = memberQuery.eq("chapter_id", chapterId)
  const { data: roleRows } = await memberQuery

  const userIds = [...new Set((roleRows ?? []).map((r) => r.user_id))]
  const chunks = []
  for (let i = 0; i < userIds.length; i += 100) {
    chunks.push(userIds.slice(i, i + 100))
  }

  for (const chunk of chunks) {
    await admin.from("notifications").insert(
      chunk.map((uid) => ({
        user_id: uid,
        notification_type: "announcement" as const,
        title: validated.data.title,
        body: validated.data.body.slice(0, 200),
        link_path: "/dashboard/announcements",
      }))
    )
  }

  revalidateMessagingPaths()
  return { success: true, message: "Announcement published." }
}
