import type { Metadata } from "next"
import { redirect } from "next/navigation"
import {
  AuditLogsDataTable,
  AuditNoteDialog,
  type AuditLogRow,
} from "@/components/portal/audit-logs-panel"
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { canViewAuditLogs, canWriteAuditLogs } from "@/lib/auth/dal"
import { getActiveChapters } from "@/lib/data/chapters"
import { getAuditLogsForAdmin } from "@/lib/data/phase6"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Audit logs",
  description: "Organization audit trail.",
}

export default async function AdminAuditLogsPage() {
  const allowed = await canViewAuditLogs()
  if (!allowed) redirect("/dashboard")

  const [canWrite, logs, chapters] = await Promise.all([
    canWriteAuditLogs(),
    getAuditLogsForAdmin({ limit: 50 }),
    getActiveChapters(),
  ])

  const chapterNameById = new Map(chapters.map((c) => [c.id, c.name]))
  const rows: AuditLogRow[] = logs.map((log) => ({
    ...log,
    chapter_name: log.chapter_id ? chapterNameById.get(log.chapter_id) ?? "Chapter" : null,
  }))

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Audit logs"
        description="Append-only record of donations and program administrator notes. Chapter officers cannot access this page."
        actions={canWrite ? <AuditNoteDialog /> : null}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent entries</CardTitle>
          <CardDescription>Most recent {logs.length} audit log rows</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogsDataTable logs={rows} />
        </CardContent>
      </Card>
    </div>
  )
}
