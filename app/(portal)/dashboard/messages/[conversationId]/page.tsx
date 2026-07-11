import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { MessageThreadView } from "@/components/portal/messaging-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { canAuditMessages, verifySession } from "@/lib/auth/dal"
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

  const [user, canAudit, userConversations] = await Promise.all([
    verifySession(),
    canAuditMessages(),
    getConversationsForUser(),
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">{studentName} · Tutor chat</h1>
          <p className="mt-2 text-muted-foreground">
            {conversation.chapters?.name ?? "Chapter"}
            {readOnly ? " · Read-only audit view" : null}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={readOnly ? routes.portal.messagesAudit : routes.portal.messages}>
            Back to {readOnly ? "audit inbox" : "inbox"}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          <MessageThreadView
            conversationId={conversationId}
            initialMessages={messages}
            currentUserId={user.id}
            readOnly={readOnly}
          />
        </CardContent>
      </Card>
    </div>
  )
}
