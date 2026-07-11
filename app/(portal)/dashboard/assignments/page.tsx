import type { Metadata } from "next"
import { redirect } from "next/navigation"
import {
  CreateAssignmentDialog,
  ParentAssignmentsView,
  TutorAssignmentsTable,
} from "@/components/portal/assignments-panel"
import { PageHeader } from "@/components/portal/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getAssignedStudentsForTutor,
  getAssignmentsForUser,
} from "@/lib/data/phase23"
import {
  getStudentsForParent,
  isParentAccount,
  isTutorAccount,
} from "@/lib/auth/dal"

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

  const [assignments, assignedStudents, familyStudents] = await Promise.all([
    getAssignmentsForUser(),
    isTutor ? getAssignedStudentsForTutor() : Promise.resolve([]),
    isParent ? getStudentsForParent() : Promise.resolve([]),
  ])

  const description = isTutor
    ? "Homework you've assigned — update status as students submit and complete work."
    : "Homework from tutors. Mark work submitted when your student finishes it."

  // Dual-role accounts see both views in tabs; the family tab only shows
  // assignments belonging to their own students.
  const familyStudentIds = new Set(familyStudents.map((student) => student.id))
  const familyAssignments = assignments.filter((assignment) =>
    familyStudentIds.has(assignment.student_id)
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Assignments"
        description={description}
        actions={
          isTutor ? <CreateAssignmentDialog students={assignedStudents} /> : undefined
        }
      />

      {isTutor && isParent ? (
        <Tabs defaultValue="teaching" className="animate-fade-up">
          <TabsList>
            <TabsTrigger value="teaching">Teaching</TabsTrigger>
            <TabsTrigger value="family">My family</TabsTrigger>
          </TabsList>
          <TabsContent value="teaching">
            <TutorAssignmentsTable
              assignments={assignments}
              students={assignedStudents}
            />
          </TabsContent>
          <TabsContent value="family">
            <ParentAssignmentsView assignments={familyAssignments} />
          </TabsContent>
        </Tabs>
      ) : isTutor ? (
        <TutorAssignmentsTable assignments={assignments} students={assignedStudents} />
      ) : (
        <ParentAssignmentsView assignments={assignments} />
      )}
    </div>
  )
}
