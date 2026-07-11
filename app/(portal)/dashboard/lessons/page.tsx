import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CalendarClock } from "lucide-react"
import { LessonsView, ScheduleLessonDialog } from "@/components/portal/lessons-panel"
import { PageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
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

  // Tutors always get their own lessons view below — canManageLessons() is
  // true for any tutor, so this only redirects users with none of the three
  // roles (e.g. a volunteer-only account).
  if (!isTutor && !isParent && !canManage) {
    redirect("/dashboard")
  }

  const perspective = isParent && !isTutor ? "parent" : isTutor ? "tutor" : "officer"

  const [lessons, assignedStudents, familyStudents] = await Promise.all([
    getLessonsForUser(),
    isTutor ? getAssignedStudentsForTutor() : Promise.resolve([]),
    isParent ? getStudentsForParent() : Promise.resolve([]),
  ])

  const description =
    perspective === "parent"
      ? "Upcoming and past lessons for your students, including times, locations, and tutor notes."
      : perspective === "tutor"
        ? "Your scheduled and past lessons. Log attendance or update status right from a lesson."
        : "Every lesson scheduled across your chapter."

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Lessons"
        description={description}
        actions={
          perspective === "tutor" ? (
            <ScheduleLessonDialog students={assignedStudents} />
          ) : undefined
        }
      />

      {perspective === "parent" && familyStudents.length === 0 ? (
        <EmptyState
          icon={<CalendarClock aria-hidden />}
          title="Add a student first"
          description="Enroll a student on your family account before lessons can be scheduled."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href={routes.portal.students}>Go to My Students</Link>
            </Button>
          }
        />
      ) : (
        <LessonsView
          lessons={lessons}
          perspective={perspective}
          emptyState={
            perspective === "tutor" ? (
              <EmptyState
                icon={<CalendarClock aria-hidden />}
                title="No lessons yet"
                description="Schedule your first lesson with an assigned student to get started."
                action={<ScheduleLessonDialog students={assignedStudents} />}
              />
            ) : (
              <EmptyState
                icon={<CalendarClock aria-hidden />}
                title="No lessons scheduled yet"
                description={
                  perspective === "parent"
                    ? "Once a tutor is assigned, they will schedule lessons here. You can also check the calendar for chapter events."
                    : "Lessons scheduled across the chapter will show up here."
                }
                action={
                  perspective === "parent" ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={routes.portal.calendar}>Open calendar</Link>
                    </Button>
                  ) : undefined
                }
              />
            )
          }
        />
      )}
    </div>
  )
}
