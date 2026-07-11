import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { ConversationList } from "@/components/portal/messaging-panel"
import { PageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { getDashboardContext } from "@/lib/auth/dal"
import { getConversationsForUser } from "@/lib/data/phase45"
import { routes } from "@/lib/routes"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Messages",
  description: "Tutor and parent conversations.",
}

export default async function MessagesPage() {
  const { hasPortalRole, canAuditMessages, user } = await getDashboardContext()
  if (!hasPortalRole) redirect("/dashboard")

  const conversations = await getConversationsForUser()

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title="Messages"
        description="Tutor–student chats include the parent account. Parents can read all messages in these conversations."
        actions={
          canAuditMessages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={routes.portal.messagesAudit}>Audit inbox</Link>
            </Button>
          ) : undefined
        }
      />

      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare aria-hidden />}
          title="No conversations yet"
          description="Conversations are created around tutor–student pairs. One opens automatically when a tutor is assigned to a student, and it includes the parent account."
        />
      ) : (
        <ConversationList conversations={conversations} currentUserId={user.id} />
      )}
    </div>
  )
}
