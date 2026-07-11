import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { TutorStudentHub } from "@/components/portal/tutor-students-panel"
import { PageHeader } from "@/components/portal/page-header"
import { Badge } from "@/components/ui/badge"
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
    title: student ? `${student.first_name} ${student.last_name}` : "Student",
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

  const descriptionParts = [
    student.chapters?.name ? `${student.chapters.name} chapter` : null,
    student.skill_level
      ? student.skill_level.charAt(0).toUpperCase() + student.skill_level.slice(1)
      : null,
  ].filter(Boolean)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="animate-fade-up">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href={routes.portal.tutorStudents}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All students
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`${student.first_name} ${student.last_name}`}
        description={
          descriptionParts.length ? descriptionParts.join(" · ") : undefined
        }
        actions={
          student.instrument ? (
            <Badge variant="secondary" className="capitalize">
              {student.instrument}
            </Badge>
          ) : undefined
        }
      />

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
