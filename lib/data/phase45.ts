import "server-only"

import { cache } from "react"
import { verifySession, getUserRoles } from "@/lib/auth/dal"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isOrgAdmin } from "@/types/enums"
import type {
  Announcement,
  Certificate,
  ConversationWithPreview,
  Message,
  Notification,
  VolunteerHour,
} from "@/types/database"

async function getReviewerChapterIds() {
  const roles = await getUserRoles()
  const roleNames = roles.map((r) => r.role)
  if (isOrgAdmin(roleNames)) return null
  return roles
    .filter((r) => ["chapter_officer", "chapter_president"].includes(r.role))
    .map((r) => r.chapter_id)
    .filter(Boolean) as string[]
}

export const getVolunteerHoursForUser = cache(async (): Promise<VolunteerHour[]> => {
  const user = await verifySession()
  const supabase = await getServerClientOrThrow()
  const { data, error } = await supabase
    .from("volunteer_hours")
    .select("*, chapters(name, slug)")
    .eq("user_id", user.id)
    .order("activity_date", { ascending: false })
  if (error) {
    console.error("getVolunteerHoursForUser", error.message)
    return []
  }
  return (data ?? []) as VolunteerHour[]
})

export const getPendingVolunteerHoursForReviewer = cache(
  async (): Promise<VolunteerHour[]> => {
    await verifySession()
    const supabase = await getServerClientOrThrow()
    const chapterIds = await getReviewerChapterIds()
    let query = supabase
      .from("volunteer_hours")
      .select("*, chapters(name, slug)")
      .eq("status", "pending")
      .order("activity_date", { ascending: false })
    if (chapterIds) {
      if (!chapterIds.length) return []
      query = query.in("chapter_id", chapterIds)
    }
    const { data, error } = await query
    if (error) {
      console.error("getPendingVolunteerHoursForReviewer", error.message)
      return []
    }
    const rows = (data ?? []) as VolunteerHour[]
    if (!rows.length) return []
    const userIds = [...new Set(rows.map((r) => r.user_id))]
    const admin = createAdminClient()
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds)
    const byId = new Map((profiles ?? []).map((p) => [p.id, p.full_name]))
    return rows.map((row) => ({
      ...row,
      profiles: { full_name: byId.get(row.user_id) ?? "Volunteer" },
    }))
  }
)

export const getCertificatesForUser = cache(async (): Promise<Certificate[]> => {
  const user = await verifySession()
  const supabase = await getServerClientOrThrow()
  const { data, error } = await supabase
    .from("certificates")
    .select("*, chapters(name, slug)")
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false })
  if (error) {
    console.error("getCertificatesForUser", error.message)
    return []
  }
  return (data ?? []) as Certificate[]
})

export const getConversationsForUser = cache(
  async (): Promise<ConversationWithPreview[]> => {
    const user = await verifySession()
    const supabase = await getServerClientOrThrow()
    const { data: memberships, error: memberError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id)
    if (memberError || !memberships?.length) return []
    const ids = memberships.map((m) => m.conversation_id)
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("*, students(first_name, last_name), chapters(name, slug)")
      .in("id", ids)
      .order("updated_at", { ascending: false })
    if (error) {
      console.error("getConversationsForUser", error.message)
      return []
    }
    const rows = (conversations ?? []) as ConversationWithPreview[]
    if (!rows.length) return []
    const admin = createAdminClient()
    const tutorIds = [...new Set(rows.map((r) => r.tutor_user_id))]
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", tutorIds)
    const tutorById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]))
    const withPreview = await Promise.all(
      rows.map(async (row) => {
        const { data: messages } = await supabase
          .from("messages")
          .select("body, created_at, sender_id")
          .eq("conversation_id", row.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(1)
        return {
          ...row,
          tutor_name: tutorById.get(row.tutor_user_id) ?? "Tutor",
          last_message: messages?.[0] ?? null,
        }
      })
    )
    return withPreview
  }
)

export const getAuditableConversations = cache(
  async (): Promise<ConversationWithPreview[]> => {
    await verifySession()
    const supabase = await getServerClientOrThrow()
    const roles = await getUserRoles()
    const roleNames = roles.map((r) => r.role)
    let query = supabase
      .from("conversations")
      .select("*, students(first_name, last_name), chapters(name, slug)")
      .order("updated_at", { ascending: false })
    if (!isOrgAdmin(roleNames) && !roleNames.includes("program_administrator")) {
      const chapterIds = roles
        .filter((r) => r.role === "chapter_president")
        .map((r) => r.chapter_id)
        .filter(Boolean) as string[]
      if (!chapterIds.length) return []
      query = query.in("chapter_id", chapterIds)
    }
    const { data, error } = await query
    if (error) {
      console.error("getAuditableConversations", error.message)
      return []
    }
    return (data ?? []) as ConversationWithPreview[]
  }
)

export const getConversationWithMessages = cache(
  async (conversationId: string): Promise<{
    conversation: ConversationWithPreview | null
    messages: Message[]
  }> => {
    await verifySession()
    const supabase = await getServerClientOrThrow()
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*, students(first_name, last_name), chapters(name, slug)")
      .eq("id", conversationId)
      .maybeSingle()
    if (convError || !conversation) return { conversation: null, messages: [] }
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
    if (msgError) {
      console.error("getConversationWithMessages", msgError.message)
      return { conversation: conversation as ConversationWithPreview, messages: [] }
    }
    const rows = (messages ?? []) as Message[]
    const senderIds = [...new Set(rows.map((m) => m.sender_id))]
    if (!senderIds.length) {
      return { conversation: conversation as ConversationWithPreview, messages: [] }
    }
    const admin = createAdminClient()
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", senderIds)
    const byId = new Map((profiles ?? []).map((p) => [p.id, p.full_name]))
    return {
      conversation: conversation as ConversationWithPreview,
      messages: rows.map((m) => ({
        ...m,
        profiles: { full_name: byId.get(m.sender_id) ?? "Member" },
      })),
    }
  }
)

export const getAnnouncementsForUser = cache(async (): Promise<Announcement[]> => {
  await verifySession()
  const supabase = await getServerClientOrThrow()
  const { data, error } = await supabase
    .from("announcements")
    .select("*, chapters(name, slug)")
    .order("published_at", { ascending: false })
    .limit(50)
  if (error) {
    console.error("getAnnouncementsForUser", error.message)
    return []
  }
  return (data ?? []) as Announcement[]
})

export const getNotificationsForUser = cache(
  async (unreadOnly = false): Promise<Notification[]> => {
    const user = await verifySession()
    const supabase = await getServerClientOrThrow()
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30)
    if (unreadOnly) query = query.is("read_at", null)
    const { data, error } = await query
    if (error) {
      console.error("getNotificationsForUser", error.message)
      return []
    }
    return (data ?? []) as Notification[]
  }
)

export const getUnreadNotificationCount = cache(async (): Promise<number> => {
  const user = await verifySession()
  const supabase = await getServerClientOrThrow()
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null)
  if (error) return 0
  return count ?? 0
})
