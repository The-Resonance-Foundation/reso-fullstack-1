import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { LogPracticeDialog, PracticeOverview } from "@/components/portal/practice-panel"
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { getStudentsForParent, isParentAccount } from "@/lib/auth/dal"
import { getPracticeLogsForParent } from "@/lib/data/phase23"

export const metadata: Metadata = {
  title: "Practice Log",
  description: "Track student practice time.",
}

export default async function PracticePage() {
  const isParent = await isParentAccount()
  if (!isParent) redirect("/dashboard")

  const [students, logs] = await Promise.all([
    getStudentsForParent(),
    getPracticeLogsForParent(),
  ])
  const activeStudents = students.filter((s) => s.status === "active")

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Practice log"
        description="Log practice minutes and track progress over time."
        actions={<LogPracticeDialog students={activeStudents} />}
      />

      <Card className="animate-fade-up">
        <CardContent className="pt-6">
          <PracticeOverview students={activeStudents} logs={logs} />
        </CardContent>
      </Card>
    </div>
  )
}
