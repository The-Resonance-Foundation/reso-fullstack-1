import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AssignmentForm, AssignmentsList } from "@/components/portal/assignments-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getAssignedStudentsForTutor,
  getAssignmentsForUser,
} from "@/lib/data/phase23"
import { isParentAccount, isTutorAccount } from "@/lib/auth/dal"

export const metadata: Metadata = {
  title: "Assignments",
  description: "Homework and practice assignments.",
}

export default async function AssignmentsPage() {
  const [isTutor, isParent] = await Promise.all([
    isTutorAccount(),
    isParentAccount(),
  ])

  if (!isTutor && !isParent) redirect("/dashboard")

  const [assignments, students] = await Promise.all([
    getAssignmentsForUser(),
    isTutor ? getAssignedStudentsForTutor() : Promise.resolve([]),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Assignments</h1>
        <p className="mt-2 text-muted-foreground">
          Homework from tutors and family submissions.
        </p>
      </div>

      {isTutor ? (
        <Card>
          <CardHeader>
            <CardTitle>Create assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignmentForm students={students} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>All assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <AssignmentsList assignments={assignments} isParent={isParent} />
        </CardContent>
      </Card>
    </div>
  )
}
