"use client"

import Link from "next/link"
import { useState } from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import { CalendarClock, CalendarPlus, ClipboardList, MapPin, Video } from "lucide-react"
import { logLesson, scheduleLesson, updateLessonStatus } from "@/app/actions/lessons"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { Lesson, LessonWithTutor, Student } from "@/types/database"
import { routes } from "@/lib/routes"
import type { LessonFormState } from "@/lib/validations/phase23"
import { ATTENDANCE_STATUSES } from "@/types/enums"

export type LessonPerspective = "parent" | "tutor" | "officer"

const LESSON_STATUS_BADGE: Record<Lesson["status"], string> = {
  scheduled: "bg-warning/15 text-warning border-transparent",
  completed: "bg-success/15 text-success border-transparent",
  cancelled: "bg-destructive/15 text-destructive border-transparent",
  no_show: "bg-destructive/15 text-destructive border-transparent",
}

const LESSON_STATUS_LABEL: Record<Lesson["status"], string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
}

function LessonStatusBadge({ status }: { status: Lesson["status"] }) {
  return <Badge className={LESSON_STATUS_BADGE[status]}>{LESSON_STATUS_LABEL[status]}</Badge>
}

function getLessonLog(lesson: Lesson) {
  return Array.isArray(lesson.lesson_logs) ? lesson.lesson_logs[0] : lesson.lesson_logs
}

function isUpcomingLesson(lesson: Lesson) {
  return (
    lesson.status === "scheduled" && new Date(lesson.scheduled_end).getTime() >= Date.now()
  )
}

export function partitionLessons<T extends Lesson>(lessons: T[]) {
  const now = Date.now()
  const upcoming: T[] = []
  const past: T[] = []

  for (const lesson of lessons) {
    const isUpcoming =
      lesson.status === "scheduled" && new Date(lesson.scheduled_end).getTime() >= now
    if (isUpcoming) upcoming.push(lesson)
    else past.push(lesson)
  }

  upcoming.sort(
    (a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
  )
  past.sort(
    (a, b) => new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime()
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

/** Schedule-lesson Dialog. Pass a single-item `students` array to preselect (e.g. from a student hub). */
export function ScheduleLessonDialog({
  students,
  trigger,
}: {
  students: Student[]
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const single = students.length === 1 ? students[0] : null

  const [state, formAction, pending] = useActionState(
    async (prev: LessonFormState, formData: FormData) => {
      const result = await scheduleLesson(prev, formData)
      if (result?.success) {
        toast.success(result.message ?? "Lesson scheduled.")
        setOpen(false)
      } else if (result?.message) {
        toast.error(result.message)
      }
      return result
    },
    undefined
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button disabled={!students.length}>
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Schedule lesson
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule a lesson</DialogTitle>
          <DialogDescription>
            {students.length === 0
              ? "You need an assigned student before you can schedule a lesson."
              : single
                ? `Set the date and time for ${single.first_name} ${single.last_name}.`
                : "Pick a student, then set the date and time."}
          </DialogDescription>
        </DialogHeader>

        {students.length ? (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="chapterId" value="" />
            {single ? (
              <input type="hidden" name="studentId" value={single.id} />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="studentId">Student</Label>
                <Select name="studentId" required>
                  <SelectTrigger id="studentId">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                        {s.instrument ? ` · ${s.instrument}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormFieldError errors={state?.errors?.studentId} />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduledStart">Start</Label>
                <Input id="scheduledStart" name="scheduledStart" type="datetime-local" required />
                <FormFieldError errors={state?.errors?.scheduledStart} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledEnd">End</Label>
                <Input id="scheduledEnd" name="scheduledEnd" type="datetime-local" required />
                <FormFieldError errors={state?.errors?.scheduledEnd} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input id="location" name="location" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meetingLink">Meeting link (optional)</Label>
              <Input id="meetingLink" name="meetingLink" type="url" placeholder="https://..." />
              <FormFieldError errors={state?.errors?.meetingLink} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? <Spinner size="sm" /> : null}
                {pending ? "Scheduling..." : "Schedule lesson"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function LessonLogDialog({ lesson }: { lesson: Lesson }) {
  const [open, setOpen] = useState(false)
  const [, formAction, pending] = useActionState(
    async (prev: LessonFormState, formData: FormData) => {
      const result = await logLesson(prev, formData)
      if (result?.success) {
        toast.success(result.message ?? "Lesson log saved.")
        setOpen(false)
      } else if (result?.message) {
        toast.error(result.message)
      }
      return result
    },
    undefined
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ClipboardList className="h-3.5 w-3.5" aria-hidden />
          Log lesson
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log this lesson</DialogTitle>
          <DialogDescription>
            Marks the lesson completed and shares your notes with the family.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="lessonId" value={lesson.id} />
          <div className="space-y-2">
            <Label htmlFor={`attendance-${lesson.id}`}>Attendance</Label>
            <Select name="attendance" defaultValue="present" required>
              <SelectTrigger id={`attendance-${lesson.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ATTENDANCE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`topics-${lesson.id}`}>Topics covered</Label>
            <Textarea id={`topics-${lesson.id}`} name="topicsCovered" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`notes-${lesson.id}`}>Notes for family</Label>
            <Textarea id={`notes-${lesson.id}`} name="tutorNotes" rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner size="sm" /> : null}
              {pending ? "Saving..." : "Save lesson log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LessonStatusActions({ lesson }: { lesson: Lesson }) {
  const [, formAction, pending] = useActionState(
    async (prev: LessonFormState, formData: FormData) => {
      const result = await updateLessonStatus(prev, formData)
      if (result?.success) toast.success(result.message ?? "Lesson updated.")
      else if (result?.message) toast.error(result.message)
      return result
    },
    undefined
  )

  if (lesson.status !== "scheduled") return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={formAction}>
        <input type="hidden" name="lessonId" value={lesson.id} />
        <input type="hidden" name="status" value="no_show" />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          Mark no-show
        </Button>
      </form>
      <ConfirmDialog
        trigger={
          <Button
            size="sm"
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
          >
            Cancel lesson
          </Button>
        }
        title="Cancel this lesson?"
        description="The tutor and family will see this lesson marked cancelled. This can't be undone from here."
        confirmLabel="Cancel lesson"
        onConfirm={async () => {
          const formData = new FormData()
          formData.set("lessonId", lesson.id)
          formData.set("status", "cancelled")
          const result = await updateLessonStatus(undefined, formData)
          if (result?.success) toast.success(result.message ?? "Lesson cancelled.")
          else if (result?.message) toast.error(result.message)
        }}
      />
    </div>
  )
}

function LessonCard({
  lesson,
  perspective,
}: {
  lesson: LessonWithTutor
  perspective: LessonPerspective
}) {
  const when = formatLessonWhen(lesson)
  const log = getLessonLog(lesson)
  const isUpcoming = isUpcomingLesson(lesson)
  const isTutorView = perspective === "tutor"

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">
              {lesson.students?.first_name} {lesson.students?.last_name}
            </CardTitle>
            {!isTutorView ? (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {lesson.tutor?.full_name
                  ? `with ${lesson.tutor.full_name}`
                  : "Tutor not yet assigned"}
              </p>
            ) : lesson.students?.instrument ? (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {lesson.students.instrument}
              </p>
            ) : null}
          </div>
          <LessonStatusBadge status={lesson.status} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 text-sm">
        <div>
          <p className="font-medium text-foreground">{when.date}</p>
          <p className="text-muted-foreground">{when.time}</p>
        </div>

        {perspective === "officer" && lesson.chapters?.name ? (
          <p className="text-muted-foreground">{lesson.chapters.name} chapter</p>
        ) : null}

        {lesson.location ? (
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {lesson.location}
          </p>
        ) : null}

        {isUpcoming && lesson.meeting_link ? (
          <Button asChild size="sm" variant="outline" className="w-fit">
            <a href={lesson.meeting_link} target="_blank" rel="noreferrer">
              <Video className="h-3.5 w-3.5" aria-hidden />
              Join online lesson
            </a>
          </Button>
        ) : null}

        {log ? (
          <div className="space-y-1 rounded-lg border bg-muted/40 p-3">
            <p className="font-medium text-foreground">Lesson summary</p>
            <p className="text-muted-foreground">
              Attendance: <span className="text-foreground">{log.attendance}</span>
            </p>
            {log.topics_covered ? (
              <p className="text-muted-foreground">
                Topics: <span className="text-foreground">{log.topics_covered}</span>
              </p>
            ) : null}
            {log.tutor_notes ? (
              <p className="text-muted-foreground">
                Notes: <span className="text-foreground">{log.tutor_notes}</span>
              </p>
            ) : null}
          </div>
        ) : isUpcoming && !isTutorView ? (
          <p className="text-muted-foreground">Your tutor will add notes after the lesson.</p>
        ) : null}

        {isTutorView && lesson.status === "scheduled" ? (
          <div className="mt-auto flex flex-col gap-2 border-t pt-3">
            {!log ? <LessonLogDialog lesson={lesson} /> : null}
            <LessonStatusActions lesson={lesson} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function LessonsView({
  lessons,
  perspective,
  emptyState,
}: {
  lessons: LessonWithTutor[]
  perspective: LessonPerspective
  /** Rendered instead of the tabs when there are no lessons at all (e.g. no students yet). */
  emptyState?: React.ReactNode
}) {
  const { upcoming, past } = partitionLessons(lessons)

  if (!lessons.length && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <Tabs defaultValue="upcoming" className="animate-fade-up">
      <TabsList>
        <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
        <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming">
        {upcoming.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((lesson, index) => (
              <div
                key={lesson.id}
                className="animate-fade-up"
                style={{ "--stagger-index": index } as React.CSSProperties}
              >
                <LessonCard lesson={lesson} perspective={perspective} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<CalendarClock aria-hidden />}
            title="No upcoming lessons"
            description="Scheduled lessons will show up here as soon as they're booked."
          />
        )}
      </TabsContent>

      <TabsContent value="past">
        {past.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {past.map((lesson, index) => (
              <div
                key={lesson.id}
                className="animate-fade-up"
                style={{ "--stagger-index": index } as React.CSSProperties}
              >
                <LessonCard lesson={lesson} perspective={perspective} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<ClipboardList aria-hidden />} title="No past lessons yet" />
        )}
      </TabsContent>
    </Tabs>
  )
}

export function UpcomingLessonsSummary({ lessons }: { lessons: LessonWithTutor[] }) {
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
    <ul className="space-y-2.5 text-sm">
      {upcoming.slice(0, 3).map((lesson) => {
        const when = formatLessonWhen(lesson)
        return (
          <li
            key={lesson.id}
            className="rounded-lg border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
          >
            <p className="font-medium text-foreground">
              {lesson.students?.first_name} {lesson.students?.last_name}
            </p>
            <p className="text-muted-foreground">{when.date}</p>
            <p className="text-muted-foreground">{when.time}</p>
            {lesson.tutor?.full_name ? (
              <p className="text-muted-foreground">with {lesson.tutor.full_name}</p>
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
