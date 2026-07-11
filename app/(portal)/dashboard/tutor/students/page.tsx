import type { Metadata } from "next"
import { redirect } from "next/navigation"
import {
  AssignedStudentsList,
  type AssignedStudentCard,
} from "@/components/portal/tutor-students-panel"
import { PageHeader } from "@/components/portal/page-header"
import { isTutorAccount } from "@/lib/auth/dal"
import {
  getAssignedStudentsForTutor,
  getLessonsForUser,
} from "@/lib/data/phase23"

export const metadata: Metadata = {
  title: "My students",
  description: "Students assigned to you for tutoring.",
}

function buildStudentCards(
  students: Awaited<ReturnType<typeof getAssignedStudentsForTutor>>,
  lessons: Awaited<ReturnType<typeof getLessonsForUser>>
): AssignedStudentCard[] {
  const now = Date.now()
  return students.map((student) => {
    const upcoming = lessons.filter(
      (lesson) =>
        lesson.student_id === student.id &&
        lesson.status === "scheduled" &&
        new Date(lesson.scheduled_end).getTime() >= now
    )
    upcoming.sort(
      (a, b) =>
        new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
    )

    return {
      student,
      upcomingCount: upcoming.length,
      nextLessonAt: upcoming[0]?.scheduled_start ?? null,
    }
  })
}

export default async function TutorStudentsPage() {
  const isTutor = await isTutorAccount()
  if (!isTutor) redirect("/dashboard")

  const [students, lessons] = await Promise.all([
    getAssignedStudentsForTutor(),
    getLessonsForUser(),
  ])

  const items = buildStudentCards(students, lessons)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="My students"
        description="Open a student's hub to schedule lessons, assign homework, share resources, and review their progress."
      />

      <AssignedStudentsList items={items} />
    </div>
  )
}
