"use client"

import Link from "next/link"
import { useActionState } from "react"
import { logLesson, scheduleLesson, updateLessonStatus } from "@/app/actions/lessons"
import { FormFieldError } from "@/components/forms/form-field-error"
import { NativeSelect } from "@/components/forms/native-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Lesson, LessonWithTutor, Student } from "@/types/database"
import { routes } from "@/lib/routes"
import { ATTENDANCE_STATUSES } from "@/types/enums"

function getLessonLog(lesson: Lesson) {
  return Array.isArray(lesson.lesson_logs)
    ? lesson.lesson_logs[0]
    : lesson.lesson_logs
}

export function partitionLessons<T extends Lesson>(lessons: T[]) {
  const now = Date.now()
  const upcoming: T[] = []
  const past: T[] = []

  for (const lesson of lessons) {
    const isUpcoming =
      lesson.status === "scheduled" &&
      new Date(lesson.scheduled_end).getTime() >= now
    if (isUpcoming) upcoming.push(lesson)
    else past.push(lesson)
  }

  upcoming.sort(
    (a, b) =>
      new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
  )
  past.sort(
    (a, b) =>
      new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime()
  )

  return { upcoming, past }
}

function formatLessonWhen(lesson: Lesson) {
  const start = new Date(lesson.scheduled_start)
  const end = new Date(lesson.scheduled_end)
  return {
    date: start.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    time: `${start.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })} – ${end.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })}`,
  }
}

function statusVariant(status: Lesson["status"]) {
  if (status === "scheduled") return "outline" as const
  if (status === "completed") return "default" as const
  return "secondary" as const
}

export function ScheduleLessonForm({
  students,
}: {
  students: Student[]
}) {
  const [state, action, pending] = useActionState(scheduleLesson, undefined)

  if (!students.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No assigned students yet. Ask a chapter officer to assign students to you.
      </p>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="studentId">Student</Label>
        <NativeSelect id="studentId" name="studentId" required defaultValue="">
          <option value="" disabled>
            Select student
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.first_name} {s.last_name} ({s.instrument ?? "instrument"})
            </option>
          ))}
        </NativeSelect>
        <FormFieldError errors={state?.errors?.studentId} />
      </div>
      <input type="hidden" name="chapterId" value="" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scheduledStart">Start</Label>
          <Input
            id="scheduledStart"
            name="scheduledStart"
            type="datetime-local"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduledEnd">End</Label>
          <Input
            id="scheduledEnd"
            name="scheduledEnd"
            type="datetime-local"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location (optional)</Label>
        <Input id="location" name="location" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="meetingLink">Meeting link (optional)</Label>
        <Input id="meetingLink" name="meetingLink" type="url" />
      </div>
      {state?.message ? (
        <p
          className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}
        >
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Scheduling..." : "Schedule lesson"}
      </Button>
    </form>
  )
}

function LessonLogForm({ lesson }: { lesson: Lesson }) {
  const [state, action, pending] = useActionState(logLesson, undefined)

  return (
    <form action={action} className="mt-3 space-y-3 border-t pt-3">
      <input type="hidden" name="lessonId" value={lesson.id} />
      <div className="space-y-2">
        <Label htmlFor={`attendance-${lesson.id}`}>Attendance</Label>
        <NativeSelect
          id={`attendance-${lesson.id}`}
          name="attendance"
          required
          defaultValue="present"
        >
          {ATTENDANCE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`topics-${lesson.id}`}>Topics covered</Label>
        <Textarea id={`topics-${lesson.id}`} name="topicsCovered" rows={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`notes-${lesson.id}`}>Tutor notes</Label>
        <Textarea id={`notes-${lesson.id}`} name="tutorNotes" rows={2} />
      </div>
      {state?.message ? (
        <p
          className={`text-xs ${state.success ? "text-primary" : "text-destructive"}`}
        >
          {state.message}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving..." : "Save lesson log"}
      </Button>
    </form>
  )
}

function LessonStatusActions({ lesson }: { lesson: Lesson }) {
  const [state, action, pending] = useActionState(updateLessonStatus, undefined)

  if (lesson.status !== "scheduled") return null

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {(["cancelled", "no_show"] as const).map((status) => (
        <form key={status} action={action}>
          <input type="hidden" name="lessonId" value={lesson.id} />
          <input type="hidden" name="status" value={status} />
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            Mark {status.replace("_", " ")}
          </Button>
        </form>
      ))}
      {state?.message ? (
        <p
          className={`w-full text-xs ${state.success ? "text-primary" : "text-destructive"}`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  )
}

function ParentLessonCard({ lesson }: { lesson: LessonWithTutor }) {
  const when = formatLessonWhen(lesson)
  const log = getLessonLog(lesson)
  const isUpcoming =
    lesson.status === "scheduled" &&
    new Date(lesson.scheduled_end).getTime() >= Date.now()

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              {lesson.students?.first_name} {lesson.students?.last_name}
            </CardTitle>
            {lesson.students?.instrument ? (
              <p className="text-sm text-muted-foreground">
                {lesson.students.instrument}
              </p>
            ) : null}
          </div>
          <Badge variant={statusVariant(lesson.status)}>{lesson.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-foreground">{when.date}</p>
          <p className="text-muted-foreground">{when.time}</p>
        </div>
        {lesson.tutor?.full_name ? (
          <p className="text-muted-foreground">
            Tutor:{" "}
            <span className="text-foreground">{lesson.tutor.full_name}</span>
          </p>
        ) : null}
        {lesson.chapters?.name ? (
          <p className="text-muted-foreground">{lesson.chapters.name} chapter</p>
        ) : null}
        {lesson.location ? (
          <p className="text-muted-foreground">
            Location:{" "}
            <span className="text-foreground">{lesson.location}</span>
          </p>
        ) : null}
        {isUpcoming && lesson.meeting_link ? (
          <Button asChild size="sm">
            <a href={lesson.meeting_link} target="_blank" rel="noreferrer">
              Join online lesson
            </a>
          </Button>
        ) : null}
        {log ? (
          <div className="rounded-md border bg-muted/40 p-3 space-y-1">
            <p className="font-medium text-foreground">Lesson summary</p>
            <p className="text-muted-foreground">
              Attendance:{" "}
              <span className="text-foreground">{log.attendance}</span>
            </p>
            {log.topics_covered ? (
              <p className="text-muted-foreground">
                Topics:{" "}
                <span className="text-foreground">{log.topics_covered}</span>
              </p>
            ) : null}
            {log.tutor_notes ? (
              <p className="text-muted-foreground">
                Tutor notes:{" "}
                <span className="text-foreground">{log.tutor_notes}</span>
              </p>
            ) : null}
          </div>
        ) : isUpcoming ? (
          <p className="text-muted-foreground">
            Your tutor will add notes after the lesson.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function ParentLessonsView({
  lessons,
  studentCount,
}: {
  lessons: LessonWithTutor[]
  studentCount: number
}) {
  if (!studentCount) {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Add a student to your family account before lessons can be scheduled.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href={routes.portal.students}>Go to My Students</Link>
        </Button>
      </div>
    )
  }

  if (!lessons.length) {
    return (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>No lessons scheduled yet for your students.</p>
        <p>
          Once a tutor is assigned, they will schedule lessons here. You can also
          check the calendar for chapter events.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href={routes.portal.calendar}>Open calendar</Link>
        </Button>
      </div>
    )
  }

  const { upcoming, past } = partitionLessons(lessons)

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium text-foreground">Upcoming</h2>
          <Link
            href={routes.portal.calendar}
            className="text-sm text-primary hover:underline"
          >
            Calendar view
          </Link>
        </div>
        {upcoming.length ? (
          <div className="space-y-4">
            {upcoming.map((lesson) => (
              <ParentLessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No upcoming lessons right now.
          </p>
        )}
      </section>

      {past.length ? (
        <section className="space-y-3">
          <h2 className="font-medium text-foreground">Past lessons</h2>
          <div className="space-y-4">
            {past.map((lesson) => (
              <ParentLessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

export function LessonsList({
  lessons,
  canLog,
}: {
  lessons: LessonWithTutor[]
  canLog: boolean
}) {
  if (!lessons.length) {
    return (
      <p className="text-sm text-muted-foreground">No lessons scheduled yet.</p>
    )
  }

  return (
    <div className="space-y-4">
      {lessons.map((lesson) => (
        <Card key={lesson.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">
                {lesson.students?.first_name} {lesson.students?.last_name}
              </CardTitle>
              <Badge variant="outline">{lesson.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>
              {new Date(lesson.scheduled_start).toLocaleString()} –{" "}
              {new Date(lesson.scheduled_end).toLocaleTimeString()}
            </p>
            {lesson.chapters?.name ? <p>{lesson.chapters.name}</p> : null}
            {lesson.location ? <p>Location: {lesson.location}</p> : null}
            {lesson.meeting_link ? (
              <p>
                <a
                  href={lesson.meeting_link}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Join meeting
                </a>
              </p>
            ) : null}
            {(() => {
              const log = getLessonLog(lesson)
              if (log) {
                return (
                  <p className="text-foreground">
                    Logged: {log.attendance}
                    {log.topics_covered ? ` · ${log.topics_covered}` : ""}
                  </p>
                )
              }
              if (canLog && lesson.status === "scheduled") {
                return <LessonLogForm lesson={lesson} />
              }
              return null
            })()}
            {canLog ? <LessonStatusActions lesson={lesson} /> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function UpcomingLessonsSummary({
  lessons,
}: {
  lessons: LessonWithTutor[]
}) {
  const { upcoming } = partitionLessons(lessons)

  if (!upcoming.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No upcoming lessons.{" "}
        <Link href={routes.portal.lessons} className="text-primary hover:underline">
          View lessons
        </Link>
      </p>
    )
  }

  return (
    <ul className="space-y-3 text-sm">
      {upcoming.slice(0, 3).map((lesson) => {
        const when = formatLessonWhen(lesson)
        return (
          <li key={lesson.id} className="rounded-md border p-3">
            <p className="font-medium">
              {lesson.students?.first_name} {lesson.students?.last_name}
            </p>
            <p className="text-muted-foreground">{when.date}</p>
            <p className="text-muted-foreground">{when.time}</p>
            {lesson.tutor?.full_name ? (
              <p className="text-muted-foreground">
                with {lesson.tutor.full_name}
              </p>
            ) : null}
          </li>
        )
      })}
      <li>
        <Link href={routes.portal.lessons} className="text-primary hover:underline">
          View all lessons →
        </Link>
      </li>
    </ul>
  )
}
