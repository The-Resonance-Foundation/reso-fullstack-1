import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { ConversationList } from "@/components/portal/messaging-panel"
import { NewMessageDialog } from "@/components/portal/new-message-dialog"
import { PageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { getDashboardContext } from "@/lib/auth/dal"
import { getConversationsForUser } from "@/lib/data/phase45"
import { getMessageableUsers } from "@/lib/messaging/directory"
import { routes } from "@/lib/routes"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Messages",
  description: "Tutor and parent conversations.",
}

export default async function MessagesPage() {
  const { hasPortalRole, canAuditMessages, user } = await getDashboardContext()
  if (!hasPortalRole) redirect("/dashboard")

  const [conversations, recipients] = await Promise.all([
    getConversationsForUser(),
    getMessageableUsers(),
  ])

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title="Messages"
        description="Message your chapter team directly. Tutor–student chats include the parent account, and parents can read all messages in them."
        actions={
          <div className="flex items-center gap-2">
            {canAuditMessages ? (
              <Button asChild variant="outline" size="sm">
                <Link href={routes.portal.messagesAudit}>Audit inbox</Link>
              </Button>
            ) : null}
            <NewMessageDialog recipients={recipients} />
          </div>
        }
      />

      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare aria-hidden />}
          title="No conversations yet"
          description="Use New message to reach your chapter team. Tutor–student chats open automatically when a tutor is assigned, and they include the parent account."
        />
      ) : (
        <ConversationList conversations={conversations} currentUserId={user.id} />
      )}
    </div>
  )
}
