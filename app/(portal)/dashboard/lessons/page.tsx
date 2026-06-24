import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  LessonsList,
  ParentLessonsView,
  ScheduleLessonForm,
} from "@/components/portal/lessons-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  canManageLessons,
  getStudentsForParent,
  isParentAccount,
  isTutorAccount,
} from "@/lib/auth/dal"
import {
  getAssignedStudentsForTutor,
  getLessonsForUser,
} from "@/lib/data/phase23"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Lessons",
  description: "View and manage music lessons.",
}

export default async function LessonsPage() {
  const [isTutor, isParent, canManage] = await Promise.all([
    isTutorAccount(),
    isParentAccount(),
    canManageLessons(),
  ])

  if (!isTutor && !isParent && !canManage) {
    redirect("/dashboard")
  }

  if (isTutor && !isParent && !canManage) {
    redirect(routes.portal.tutorStudents)
  }

  const [lessons, assignedStudents, familyStudents] = await Promise.all([
    getLessonsForUser(),
    isTutor ? getAssignedStudentsForTutor() : Promise.resolve([]),
    isParent ? getStudentsForParent() : Promise.resolve([]),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">
          {isParent && !isTutor ? "Family lessons" : "Lessons"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isParent && !isTutor
            ? "Upcoming and past lessons for your students, including times, locations, and tutor notes."
            : "Upcoming and past lessons for your students."}
        </p>
        {isParent && !isTutor ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Need the full schedule?{" "}
            <Link href={routes.portal.calendar} className="text-primary hover:underline">
              Open the calendar
            </Link>
            .
          </p>
        ) : null}
      </div>

      {isTutor ? (
        <Card>
          <CardHeader>
            <CardTitle>Schedule a lesson</CardTitle>
            <CardDescription>
              Prefer scheduling from{" "}
              <Link href={routes.portal.tutorStudents} className="text-primary hover:underline">
                My students
              </Link>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScheduleLessonForm students={assignedStudents} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            {isParent && !isTutor
              ? "Your students"
              : isTutor
                ? "All scheduled lessons"
                : "Chapter lessons"}
          </CardTitle>
          {isParent && !isTutor ? (
            <CardDescription>
              Lessons for{" "}
              {familyStudents.length === 1
                ? "1 student"
                : `${familyStudents.length} students`}{" "}
              on your account.
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          {isParent && !isTutor ? (
            <ParentLessonsView
              lessons={lessons}
              studentCount={familyStudents.length}
            />
          ) : (
            <LessonsList lessons={lessons} canLog={isTutor} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
