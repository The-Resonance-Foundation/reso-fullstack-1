import type { Metadata } from "next"
import { redirect } from "next/navigation"
import {
  AssignedStudentsList,
  type AssignedStudentCard,
} from "@/components/portal/tutor-students-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isTutorAccount } from "@/lib/auth/dal"
import {
  getAssignedStudentsForTutor,
  getLessonsForUser,
} from "@/lib/data/phase23"

export const metadata: Metadata = {
  title: "My students",
  description: "Students assigned to you for tutoring.",
}

export default async function TutorStudentsPage() {
  const isTutor = await isTutorAccount()
  if (!isTutor) redirect("/dashboard")

  const [students, lessons] = await Promise.all([
    getAssignedStudentsForTutor(),
    getLessonsForUser(),
  ])

  const now = Date.now()
  const items: AssignedStudentCard[] = students.map((student) => {
    const studentLessons = lessons.filter((lesson) => lesson.student_id === student.id)
    const upcoming = studentLessons.filter(
      (lesson) =>
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">My students</h1>
        <p className="mt-2 text-muted-foreground">
          Open a student to schedule lessons, assign homework, share resources, and
          review their progress.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned students</CardTitle>
        </CardHeader>
        <CardContent>
          <AssignedStudentsList items={items} />
        </CardContent>
      </Card>
    </div>
  )
}
