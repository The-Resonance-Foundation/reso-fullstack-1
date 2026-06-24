import type { Metadata } from "next"
import { redirect } from "next/navigation"
import {
  TutorAssignmentForm,
  TutorAssignmentsList,
} from "@/components/portal/tutor-assignments-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { canReviewApplicants } from "@/lib/auth/dal"
import {
  getActiveStudentsForReviewer,
  getTutorAssignmentsForReviewer,
  getTutorsForAssignment,
} from "@/lib/data/phase23"

export const metadata: Metadata = {
  title: "Tutor assignments",
  description: "Assign tutors to students.",
}

export const dynamic = "force-dynamic"

export default async function TutorAssignmentsPage() {
  const allowed = await canReviewApplicants()
  if (!allowed) redirect("/dashboard")

  const [students, tutors, assignments] = await Promise.all([
    getActiveStudentsForReviewer(),
    getTutorsForAssignment(),
    getTutorAssignmentsForReviewer(),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Tutor assignments</h1>
        <p className="mt-2 text-muted-foreground">
          Connect tutors with the students they will teach.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assign tutor</CardTitle>
        </CardHeader>
        <CardContent>
          <TutorAssignmentForm students={students} tutors={tutors} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <TutorAssignmentsList assignments={assignments} />
        </CardContent>
      </Card>
    </div>
  )
}
