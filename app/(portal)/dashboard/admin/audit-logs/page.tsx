import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AuditLogsTable, AuditNoteForm } from "@/components/portal/audit-logs-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { canViewAuditLogs, canWriteAuditLogs } from "@/lib/auth/dal"
import { getAuditLogsForAdmin } from "@/lib/data/phase6"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Audit logs",
  description: "Organization audit trail.",
}

export default async function AdminAuditLogsPage() {
  const allowed = await canViewAuditLogs()
  if (!allowed) redirect("/dashboard")

  const canWrite = await canWriteAuditLogs()
  const logs = await getAuditLogsForAdmin({ limit: 50 })

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Audit logs</h1>
        <p className="mt-2 text-muted-foreground">
          Append-only record of donations and program administrator notes. Chapter
          officers cannot access this page.
        </p>
      </div>

      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add audit note</CardTitle>
            <CardDescription>
              Program administrators and board members can append compliance notes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuditNoteForm />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent entries</CardTitle>
          <CardDescription>Most recent 50 audit log rows</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogsTable logs={logs} />
        </CardContent>
      </Card>
    </div>
  )
}
