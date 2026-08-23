import type { Metadata } from "next"
import { redirect } from "next/navigation"
import {
  AuditLogsDataTable,
  AuditNoteDialog,
  type AuditLogRow,
} from "@/components/portal/audit-logs-panel"
import { PageHeader } from "@/components/portal/page-header"
import { PaginationBar } from "@/components/portal/pagination-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { canViewAuditLogs, canWriteAuditLogs } from "@/lib/auth/dal"
import { getActiveChapters } from "@/lib/data/chapters"
import { getAuditLogsForAdmin } from "@/lib/data/phase6"
import { routes } from "@/lib/routes"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 50

export const metadata: Metadata = {
  title: "Audit logs",
  description: "Organization audit trail.",
}

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const allowed = await canViewAuditLogs()
  if (!allowed) redirect("/dashboard")

  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1)

  const [canWrite, fetched, chapters] = await Promise.all([
    canWriteAuditLogs(),
    // One extra row detects whether an older page exists.
    getAuditLogsForAdmin({ limit: PAGE_SIZE + 1, offset: (page - 1) * PAGE_SIZE }),
    getActiveChapters(),
  ])
  const hasMore = fetched.length > PAGE_SIZE
  const logs = fetched.slice(0, PAGE_SIZE)

  const chapterNameById = new Map(chapters.map((c) => [c.id, c.name]))
  const rows: AuditLogRow[] = logs.map((log) => ({
    ...log,
    chapter_name: log.chapter_id ? chapterNameById.get(log.chapter_id) ?? "Chapter" : null,
  }))

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Audit logs"
        description="Append-only record of sensitive actions. Donation entries are visible to the board only; program administrators see the chapter-level trail."
        actions={canWrite ? <AuditNoteDialog /> : null}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent entries</CardTitle>
          <CardDescription>Most recent {logs.length} audit log rows</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogsDataTable logs={rows} />
          <PaginationBar
            page={page}
            hasMore={hasMore}
            basePath={routes.portal.admin.auditLogs}
          />
        </CardContent>
      </Card>
    </div>
  )
}
