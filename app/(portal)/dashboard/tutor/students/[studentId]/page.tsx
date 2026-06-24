import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { TutorStudentHub } from "@/components/portal/tutor-students-panel"
import { Button } from "@/components/ui/button"
import { isTutorAccount } from "@/lib/auth/dal"
import {
  getAssignedStudentForTutor,
  getAssignmentsForStudent,
  getLessonsForStudent,
  getPracticeLogsForStudent,
  getStudentResourcesForTutor,
} from "@/lib/data/phase23"
import { routes } from "@/lib/routes"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ studentId: string }>
}): Promise<Metadata> {
  const { studentId } = await params
  const student = await getAssignedStudentForTutor(studentId)

  return {
    title: student
      ? `${student.first_name} ${student.last_name}`
      : "Student",
    description: "Manage lessons and assignments for this student.",
  }
}

export default async function TutorStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const isTutor = await isTutorAccount()
  if (!isTutor) redirect("/dashboard")

  const { studentId } = await params
  const student = await getAssignedStudentForTutor(studentId)
  if (!student) notFound()

  const [lessons, assignments, resources, practiceLogs] = await Promise.all([
    getLessonsForStudent(studentId),
    getAssignmentsForStudent(studentId),
    getStudentResourcesForTutor(studentId),
    getPracticeLogsForStudent(studentId),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="outline" size="sm">
            <Link href={routes.portal.tutorStudents}>← All students</Link>
          </Button>
          <h1 className="mt-4 font-serif text-3xl font-bold">
            {student.first_name} {student.last_name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Schedule lessons, homework, and resources for this student.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={routes.portal.calendar}>View calendar</Link>
        </Button>
      </div>

      <TutorStudentHub
        student={student}
        lessons={lessons}
        assignments={assignments}
        resources={resources}
        practiceLogs={practiceLogs}
      />
    </div>
  )
}
