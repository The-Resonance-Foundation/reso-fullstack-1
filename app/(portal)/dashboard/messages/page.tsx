import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ConversationList } from "@/components/portal/messaging-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardContext } from "@/lib/auth/dal"
import { getConversationsForUser } from "@/lib/data/phase45"
import { routes } from "@/lib/routes"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Messages",
  description: "Tutor and parent conversations.",
}

export default async function MessagesPage() {
  const { hasPortalRole, canAuditMessages } = await getDashboardContext()
  if (!hasPortalRole) redirect("/dashboard")

  const conversations = await getConversationsForUser()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Messages</h1>
          <p className="mt-2 text-muted-foreground">
            Tutor–student chats include the parent account. Parents can read all
            messages in these conversations.
          </p>
        </div>
        {canAuditMessages ? (
          <Button asChild variant="outline" size="sm">
            <Link href={routes.portal.messagesAudit}>Audit inbox</Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inbox</CardTitle>
          <CardDescription>
            Threads are created when a tutor is assigned to a student
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConversationList conversations={conversations} />
        </CardContent>
      </Card>
    </div>
  )
}
