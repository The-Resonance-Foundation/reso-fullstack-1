"use server"

import { redirect } from "next/navigation"
import { verifySession, getUserRoles } from "@/lib/auth/dal"
import { emailMessageNotification } from "@/lib/email/portal-notifications"
import { canDirectMessage } from "@/lib/messaging/directory"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import { revalidateMessagingPaths } from "@/lib/portal/revalidate-messaging"
import { routes } from "@/lib/routes"
import {
  messageSchema,
  startConversationSchema,
  type MessageFormState,
} from "@/lib/validations/phase45"

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

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", [...recipients, senderId])
  const senderName =
    profiles?.find((p) => p.id === senderId)?.full_name ?? "A Resonance member"
  await emailMessageNotification({
    recipients: (profiles ?? [])
      .filter((p) => p.id !== senderId)
      .map((p) => ({ email: p.email, name: p.full_name })),
    senderName,
    preview: body,
    conversationId,
  })
}

export async function sendMessage(
  _prev: MessageFormState,
  formData: FormData
): Promise<MessageFormState> {
  const validated = messageSchema.safeParse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body"),
  })
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: "Messages need to be between 1 and 4,000 characters.",
    }
  }

  const user = await verifySession()
  const supabase = await getServerClientOrThrow()
  const { data: membership } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("conversation_id", validated.data.conversationId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!membership) {
    return {
      message: "You're not a member of this conversation, so you can't send messages here.",
    }
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: validated.data.conversationId,
    sender_id: user.id,
    body: validated.data.body,
  })
  if (error) {
    console.error("sendMessage", error.message)
    return { message: "Something went wrong sending your message. Please try again." }
  }

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", validated.data.conversationId)

  await notifyMembers(validated.data.conversationId, user.id, validated.data.body)
  revalidateMessagingPaths(validated.data.conversationId)
  return { success: true, message: "Message sent." }
}

export async function startConversation(
  _prev: MessageFormState,
  formData: FormData
): Promise<MessageFormState> {
  const validated = startConversationSchema.safeParse({
    recipientId: formData.get("recipientId"),
    body: formData.get("body"),
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }
  const { recipientId, body } = validated.data

  const user = await verifySession()
  if (recipientId === user.id) {
    return { message: "You can't start a conversation with yourself." }
  }

  const allowed = await canDirectMessage(recipientId)
  if (!allowed) {
    return { message: "You can't start a conversation with this member." }
  }

  // Reuse an existing direct thread between this exact pair.
  const admin = createAdminClient()
  const [{ data: myConvos }, { data: theirConvos }] = await Promise.all([
    admin.from("conversation_members").select("conversation_id").eq("user_id", user.id),
    admin.from("conversation_members").select("conversation_id").eq("user_id", recipientId),
  ])
  const theirIds = new Set((theirConvos ?? []).map((m) => m.conversation_id))
  const sharedIds = (myConvos ?? [])
    .map((m) => m.conversation_id)
    .filter((id) => theirIds.has(id))

  let conversationId: string | null = null
  if (sharedIds.length) {
    const { data: existing } = await admin
      .from("conversations")
      .select("id")
      .in("id", sharedIds)
      .eq("conversation_type", "direct")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    conversationId = existing?.id ?? null
  }

  if (!conversationId) {
    // Direct threads still belong to a chapter for audit scoping: the
    // starter's chapter, falling back to the recipient's.
    const myRoles = await getUserRoles()
    let chapterId = myRoles.find((r) => r.chapter_id)?.chapter_id ?? null
    if (!chapterId) {
      const { data: theirRole } = await admin
        .from("user_roles")
        .select("chapter_id")
        .eq("user_id", recipientId)
        .eq("status", "active")
        .not("chapter_id", "is", null)
        .limit(1)
        .maybeSingle()
      chapterId = theirRole?.chapter_id ?? null
    }
    if (!chapterId) {
      return { message: "Couldn't determine a chapter for this conversation." }
    }

    const { data: created, error: createError } = await admin
      .from("conversations")
      .insert({
        chapter_id: chapterId,
        conversation_type: "direct",
        created_by: user.id,
      })
      .select("id")
      .single()
    if (createError || !created) {
      console.error("startConversation create", createError?.message)
      return { message: "Something went wrong starting the conversation. Please try again." }
    }
    const { error: memberError } = await admin.from("conversation_members").insert([
      { conversation_id: created.id, user_id: user.id },
      { conversation_id: created.id, user_id: recipientId },
    ])
    if (memberError) {
      console.error("startConversation members", memberError.message)
      await admin.from("conversations").delete().eq("id", created.id)
      return { message: "Something went wrong starting the conversation. Please try again." }
    }
    conversationId = created.id
  }

  const threadId = conversationId
  if (!threadId) {
    return { message: "Something went wrong starting the conversation. Please try again." }
  }

  // First message goes through the user-scoped client so RLS still applies.
  const supabase = await getServerClientOrThrow()
  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: threadId,
    sender_id: user.id,
    body,
  })
  if (messageError) {
    console.error("startConversation message", messageError.message)
    return { message: "The conversation was created but the message failed. Open it and try again." }
  }

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadId)

  await notifyMembers(threadId, user.id, body)
  revalidateMessagingPaths(threadId)
  redirect(routes.portal.messageThread(threadId))
}

export async function softDeleteMessage(
  _prev: MessageFormState,
  formData: FormData
): Promise<MessageFormState> {
  const messageId = String(formData.get("messageId") ?? "")
  const conversationId = String(formData.get("conversationId") ?? "")
  if (!messageId) {
    return { message: "We couldn't tell which message to remove. Refresh and try again." }
  }

  const user = await verifySession()
  const supabase = await getServerClientOrThrow()
  const { error } = await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("sender_id", user.id)
  if (error) {
    console.error("softDeleteMessage", error.message)
    return { message: "Something went wrong removing the message. Please try again." }
  }
  revalidateMessagingPaths(conversationId)
  return { success: true, message: "Message removed." }
}
