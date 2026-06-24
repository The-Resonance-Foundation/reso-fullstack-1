import type { Metadata } from "next"
import { redirect } from "next/navigation"
import {
  PracticeChart,
  PracticeLogForm,
  PracticeLogList,
} from "@/components/portal/practice-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Practice log</h1>
        <p className="mt-2 text-muted-foreground">
          Log practice minutes and track progress over time.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log practice</CardTitle>
        </CardHeader>
        <CardContent>
          <PracticeLogForm students={activeStudents} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <PracticeChart logs={logs} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent entries</CardTitle>
        </CardHeader>
        <CardContent>
          <PracticeLogList logs={logs} />
        </CardContent>
      </Card>
    </div>
  )
}
