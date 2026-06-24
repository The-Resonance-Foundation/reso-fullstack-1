"use server"

import { verifySession } from "@/lib/auth/dal"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import { revalidateMessagingPaths } from "@/lib/portal/revalidate-messaging"
import { messageSchema, type MessageFormState } from "@/lib/validations/phase45"

async function notifyMembers(conversationId: string, senderId: string, body: string) {
  const admin = createAdminClient()
  const { data: members } = await admin
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId)
  const recipients = (members ?? []).map((m) => m.user_id).filter((id) => id !== senderId)
  if (!recipients.length) return
  await admin.from("notifications").insert(
    recipients.map((userId) => ({
      user_id: userId,
      notification_type: "message" as const,
      title: "New message",
      body: body.slice(0, 120),
      link_path: `/dashboard/messages/${conversationId}`,
    }))
  )
}

export async function sendMessage(
  _prev: MessageFormState,
  formData: FormData
): Promise<MessageFormState> {
  const validated = messageSchema.safeParse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body"),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const user = await verifySession()
  const supabase = await getServerClientOrThrow()
  const { data: membership } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("conversation_id", validated.data.conversationId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!membership) return { message: "You are not a member of this conversation." }

  const { error } = await supabase.from("messages").insert({
    conversation_id: validated.data.conversationId,
    sender_id: user.id,
    body: validated.data.body,
  })
  if (error) return { message: error.message }

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", validated.data.conversationId)

  await notifyMembers(validated.data.conversationId, user.id, validated.data.body)
  revalidateMessagingPaths(validated.data.conversationId)
  return { success: true, message: "Message sent." }
}

export async function softDeleteMessage(
  _prev: MessageFormState,
  formData: FormData
): Promise<MessageFormState> {
  const messageId = String(formData.get("messageId") ?? "")
  const conversationId = String(formData.get("conversationId") ?? "")
  if (!messageId) return { message: "Missing message." }

  const user = await verifySession()
  const supabase = await getServerClientOrThrow()
  const { error } = await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("sender_id", user.id)
  if (error) return { message: error.message }
  revalidateMessagingPaths(conversationId)
  return { success: true, message: "Message removed." }
}
