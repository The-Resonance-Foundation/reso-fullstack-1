import type { Metadata } from "next"
import { redirect } from "next/navigation"
import {
  AssignTutorDialog,
  TutorAssignmentsList,
} from "@/components/portal/tutor-assignments-panel"
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent } from "@/components/ui/card"
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
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Tutor assignments"
        description="Connect tutors with the students they will teach."
        actions={<AssignTutorDialog students={students} tutors={tutors} />}
      />

      <Card className="animate-fade-up">
        <CardContent className="pt-6">
          <TutorAssignmentsList assignments={assignments} />
        </CardContent>
      </Card>
    </div>
  )
}
