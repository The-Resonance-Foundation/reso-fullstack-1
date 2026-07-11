import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { MessageThread } from "@/components/portal/message-thread"
import { canAuditMessages, getProfile, verifySession } from "@/lib/auth/dal"
import { getConversationWithMessages, getConversationsForUser } from "@/lib/data/phase45"
import { routes } from "@/lib/routes"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ conversationId: string }>
  searchParams: Promise<{ audit?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { conversationId } = await params
  const { conversation } = await getConversationWithMessages(conversationId)
  if (!conversation?.students) {
    return { title: "Conversation" }
  }
  return {
    title: `${conversation.students.first_name} ${conversation.students.last_name} · Tutor chat`,
  }
}

export default async function MessageThreadPage({ params, searchParams }: PageProps) {
  const { conversationId } = await params
  const { audit } = await searchParams
  const auditMode = audit === "1"

  const [user, canAudit, userConversations, profile] = await Promise.all([
    verifySession(),
    canAuditMessages(),
    getConversationsForUser(),
    getProfile(),
  ])

  // Only a genuinely-authorized audit view (query param AND permission) may
  // see soft-deleted message bodies; a member tacking ?audit=1 onto their own
  // conversation must not be able to bypass the normal deleted-message filter.
  const isAuditView = auditMode && canAudit
  const { conversation, messages } = await getConversationWithMessages(
    conversationId,
    isAuditView
  )

  if (!conversation) notFound()

  const isMember = userConversations.some((c) => c.id === conversationId)
  if (!isMember && !isAuditView) {
    redirect(routes.portal.messages)
  }

  const readOnly = auditMode
  const studentName = conversation.students
    ? `${conversation.students.first_name} ${conversation.students.last_name}`
    : "Student"

  // userId → name for everyone known to be in this thread, so realtime
  // messages can be attributed client-side without waiting for a refresh.
  const conversationEntry = userConversations.find((c) => c.id === conversationId)
  const memberNames: Record<string, string> = {}
  for (const message of messages) {
    if (message.profiles?.full_name) {
      memberNames[message.sender_id] = message.profiles.full_name
    }
  }
  if (conversationEntry?.tutor_name && !memberNames[conversation.tutor_user_id]) {
    memberNames[conversation.tutor_user_id] = conversationEntry.tutor_name
  }
  if (profile?.full_name && !memberNames[user.id]) {
    memberNames[user.id] = profile.full_name
  }

  const tutorName =
    memberNames[conversation.tutor_user_id] ?? conversationEntry?.tutor_name ?? "Tutor"

  return (
    <div className="mx-auto w-full max-w-3xl">
      <MessageThread
        conversationId={conversationId}
        initialMessages={messages}
        currentUserId={user.id}
        memberNames={memberNames}
        title={`${studentName} · Tutor chat`}
        subtitle={`${tutorName} · ${conversation.chapters?.name ?? "Chapter"}`}
        readOnly={readOnly}
        showDeleted={isAuditView}
        backHref={readOnly ? routes.portal.messagesAudit : routes.portal.messages}
        backLabel={readOnly ? "Back to audit inbox" : "Back to inbox"}
      />
    </div>
  )
}
