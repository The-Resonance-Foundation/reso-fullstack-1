import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ConversationList } from "@/components/portal/messaging-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { canAuditMessages } from "@/lib/auth/dal"
import { getAuditableConversations } from "@/lib/data/phase45"
import { routes } from "@/lib/routes"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Message audit",
  description: "Read-only audit access to tutor–student conversations.",
}

export default async function MessagesAuditPage() {
  const allowed = await canAuditMessages()
  if (!allowed) redirect("/dashboard")

  const conversations = await getAuditableConversations()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Message audit</h1>
          <p className="mt-2 text-muted-foreground">
            Read-only access for chapter presidents, program administrators, and board
            members. You cannot send messages from this view.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={routes.portal.messages}>Your inbox</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Auditable conversations</CardTitle>
          <CardDescription>Tutor–student threads in your scope</CardDescription>
        </CardHeader>
        <CardContent>
          <ConversationList conversations={conversations} audit />
        </CardContent>
      </Card>
    </div>
  )
}
