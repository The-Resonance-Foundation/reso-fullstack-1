import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Eye } from "lucide-react"
import { AuditConversationList } from "@/components/portal/message-audit-panel"
import { PageHeader } from "@/components/portal/page-header"
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
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Message audit"
        description="Read-only access for chapter presidents, program administrators, and board members."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={routes.portal.messages}>Your inbox</Link>
          </Button>
        }
      />

      <div className="animate-fade-up flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
        <Eye className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
        <p>
          <span className="font-medium">Audit view.</span> You can read every message in
          these tutor–student threads, but you cannot send messages or reply from here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Auditable conversations</CardTitle>
          <CardDescription>
            {conversations.length} tutor–student thread{conversations.length === 1 ? "" : "s"} in
            your scope
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditConversationList conversations={conversations} />
        </CardContent>
      </Card>
    </div>
  )
}
