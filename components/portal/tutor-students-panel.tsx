"use client"

import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createAssignment } from "@/app/actions/assignments"
import { logLesson, scheduleLesson, updateLessonStatus } from "@/app/actions/lessons"
import { addResource } from "@/app/actions/resources"
import { FormFieldError } from "@/components/forms/form-field-error"
import { NativeSelect } from "@/components/forms/native-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { partitionLessons } from "@/components/portal/lessons-panel"
import { routes } from "@/lib/routes"
import type {
  AssignmentFormState,
  LessonFormState,
  ResourceFormState,
} from "@/lib/validations/phase23"
import type {
  Assignment,
  LessonWithTutor,
  PracticeLog,
  Resource,
  Student,
} from "@/types/database"
import { ATTENDANCE_STATUSES, RESOURCE_STORAGE_TYPES } from "@/types/enums"

export type AssignedStudentCard = {
  student: Student
  upcomingCount: number
  nextLessonAt: string | null
}

function useRefreshOnSuccess(success?: boolean) {
  const router = useRouter()
  useEffect(() => {
    if (success) router.refresh()
  }, [success, router])
}

export function AssignedStudentsList({
  items,
}: {
  items: AssignedStudentCard[]
}) {
  if (!items.length) {
    return (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>No students assigned to you yet.</p>
        <p>
          A chapter officer connects tutors and students on the Tutor assignments
          page. Once assigned, each student appears here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map(({ student, upcomingCount, nextLessonAt }) => (
        <Link
          key={student.id}
          href={routes.portal.tutorStudent(student.id)}
          className="block rounded-lg border bg-card p-5 transition-colors hover:bg-muted/40"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">
                {student.first_name} {student.last_name}
              </p>
              {student.instrument ? (
                <p className="text-sm text-muted-foreground">{student.instrument}</p>
              ) : null}
            </div>
            {upcomingCount > 0 ? (
              <Badge variant="outline">
                {upcomingCount} upcoming
              </Badge>
            ) : null}
          </div>
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            {student.chapters?.name ? <p>{student.chapters.name}</p> : null}
            {student.skill_level ? <p>Level: {student.skill_level}</p> : null}
            {nextLessonAt ? (
              <p>
                Next lesson:{" "}
                {new Date(nextLessonAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            ) : (
              <p>No upcoming lessons</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

function StudentScheduleLessonForm({ student }: { student: Student }) {
  const [state, setState] = useState<LessonFormState>(undefined)
  const [pending, startTransition] = useTransition()
  useRefreshOnSuccess(state?.success)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData()
    formData.set("studentId", student.id)
    formData.set("chapterId", student.chapter_id)
    formData.set("scheduledStart", String(new FormData(form).get("scheduledStart") ?? ""))
    formData.set("scheduledEnd", String(new FormData(form).get("scheduledEnd") ?? ""))
    formData.set("location", String(new FormData(form).get("location") ?? ""))
    formData.set("meetingLink", String(new FormData(form).get("meetingLink") ?? ""))

    startTransition(async () => {
      setState(await scheduleLesson(undefined, formData))
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scheduledStart">Start</Label>
          <Input id="scheduledStart" name="scheduledStart" type="datetime-local" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduledEnd">End</Label>
          <Input id="scheduledEnd" name="scheduledEnd" type="datetime-local" required />
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
      <FormFieldError errors={state?.errors?.scheduledStart} />
      <FormFieldError errors={state?.errors?.studentId} />
      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Scheduling..." : "Schedule lesson"}
      </Button>
    </form>
  )
}

function StudentAssignmentForm({ student }: { student: Student }) {
  const [state, setState] = useState<AssignmentFormState>(undefined)
  const [pending, startTransition] = useTransition()
  useRefreshOnSuccess(state?.success)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const raw = new FormData(form)
    const formData = new FormData()
    formData.set("studentId", student.id)
    formData.set("title", String(raw.get("title") ?? ""))
    formData.set("description", String(raw.get("description") ?? ""))
    formData.set("dueDate", String(raw.get("dueDate") ?? ""))

    startTransition(async () => {
      setState(await createAssignment(undefined, formData))
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
        <FormFieldError errors={state?.errors?.title} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueDate">Due date (optional)</Label>
        <Input id="dueDate" name="dueDate" type="date" />
      </div>
      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create assignment"}
      </Button>
    </form>
  )
}

function StudentResourceForm({ student }: { student: Student }) {
  const [state, setState] = useState<ResourceFormState>(undefined)
  const [storageType, setStorageType] = useState("link")
  const [pending, startTransition] = useTransition()
  useRefreshOnSuccess(state?.success)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const raw = new FormData(form)
    const formData = new FormData()
    formData.set("chapterId", student.chapter_id)
    formData.set("studentId", student.id)
    formData.set("title", String(raw.get("title") ?? ""))
    formData.set("description", String(raw.get("description") ?? ""))
    formData.set("storageType", storageType)
    formData.set("url", String(raw.get("url") ?? ""))

    startTransition(async () => {
      setState(await addResource(undefined, formData))
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
        <FormFieldError errors={state?.errors?.title} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="storageType">Type</Label>
        <NativeSelect
          id="storageType"
          name="storageType"
          value={storageType}
          onChange={(event) => setStorageType(event.target.value)}
        >
          {RESOURCE_STORAGE_TYPES.filter((type) => type !== "supabase").map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input id="url" name="url" type="url" placeholder="https://..." required />
      </div>
      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add resource"}
      </Button>
    </form>
  )
}

function LessonLogInlineForm({ lesson }: { lesson: LessonWithTutor }) {
  const [state, setState] = useState<LessonFormState>(undefined)
  const [pending, startTransition] = useTransition()
  useRefreshOnSuccess(state?.success)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const raw = new FormData(event.currentTarget)
    const formData = new FormData()
    formData.set("lessonId", lesson.id)
    formData.set("attendance", String(raw.get("attendance") ?? "present"))
    formData.set("topicsCovered", String(raw.get("topicsCovered") ?? ""))
    formData.set("tutorNotes", String(raw.get("tutorNotes") ?? ""))

    startTransition(async () => {
      setState(await logLesson(undefined, formData))
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 border-t pt-3">
      <div className="space-y-2">
        <Label htmlFor={`attendance-${lesson.id}`}>Attendance</Label>
        <NativeSelect
          id={`attendance-${lesson.id}`}
          name="attendance"
          defaultValue="present"
          required
        >
          {ATTENDANCE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`topics-${lesson.id}`}>Topics covered</Label>
        <Textarea id={`topics-${lesson.id}`} name="topicsCovered" rows={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`notes-${lesson.id}`}>Notes for family</Label>
        <Textarea id={`notes-${lesson.id}`} name="tutorNotes" rows={2} />
      </div>
      {state?.message ? (
        <p className={`text-xs ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving..." : "Save lesson log"}
      </Button>
    </form>
  )
}

function LessonStatusButtons({ lesson }: { lesson: LessonWithTutor }) {
  const [state, setState] = useState<LessonFormState>(undefined)
  const [pending, startTransition] = useTransition()
  useRefreshOnSuccess(state?.success)

  if (lesson.status !== "scheduled") return null

  function updateStatus(status: "cancelled" | "no_show") {
    const formData = new FormData()
    formData.set("lessonId", lesson.id)
    formData.set("status", status)
    startTransition(async () => {
      setState(await updateLessonStatus(undefined, formData))
    })
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {(["cancelled", "no_show"] as const).map((status) => (
        <Button
          key={status}
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => updateStatus(status)}
        >
          Mark {status.replace("_", " ")}
        </Button>
      ))}
      {state?.message ? (
        <p className={`w-full text-xs ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
    </div>
  )
}

function StudentLessonCard({ lesson }: { lesson: LessonWithTutor }) {
  const log = Array.isArray(lesson.lesson_logs)
    ? lesson.lesson_logs[0]
    : lesson.lesson_logs

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            {new Date(lesson.scheduled_start).toLocaleString()}
          </CardTitle>
          <Badge variant="outline">{lesson.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        {lesson.location ? <p>Location: {lesson.location}</p> : null}
        {lesson.meeting_link ? (
          <a
            href={lesson.meeting_link}
            className="text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Meeting link
          </a>
        ) : null}
        {log ? (
          <p className="text-foreground">
            Logged: {log.attendance}
            {log.topics_covered ? ` · ${log.topics_covered}` : ""}
            {log.tutor_notes ? ` · ${log.tutor_notes}` : ""}
          </p>
        ) : lesson.status === "scheduled" ? (
          <LessonLogInlineForm lesson={lesson} />
        ) : null}
        <LessonStatusButtons lesson={lesson} />
      </CardContent>
    </Card>
  )
}

function StudentAssignmentsList({ assignments }: { assignments: Assignment[] }) {
  if (!assignments.length) {
    return <p className="text-sm text-muted-foreground">No assignments yet.</p>
  }

  return (
    <ul className="space-y-3">
      {assignments.map((assignment) => (
        <li key={assignment.id} className="rounded-md border p-4 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{assignment.title}</p>
              {assignment.due_date ? (
                <p className="text-muted-foreground">Due {assignment.due_date}</p>
              ) : null}
              {assignment.description ? <p className="mt-1">{assignment.description}</p> : null}
            </div>
            <Badge variant="outline">{assignment.status}</Badge>
          </div>
        </li>
      ))}
    </ul>
  )
}

function StudentResourcesList({ resources }: { resources: Resource[] }) {
  if (!resources.length) {
    return <p className="text-sm text-muted-foreground">No student resources yet.</p>
  }

  return (
    <ul className="space-y-3">
      {resources.map((resource) => (
        <li key={resource.id} className="rounded-md border p-4 text-sm">
          <p className="font-medium">{resource.title}</p>
          <p className="text-muted-foreground">{resource.storage_type}</p>
          {resource.description ? <p className="mt-1">{resource.description}</p> : null}
          {resource.url ? (
            <a
              href={resource.url}
              className="mt-1 inline-block text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Open resource
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function StudentPracticeList({ logs }: { logs: PracticeLog[] }) {
  if (!logs.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No practice logged by the family yet.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {logs.map((log) => (
        <li key={log.id} className="rounded-md border p-3 text-sm">
          {log.minutes} min on {log.practiced_on}
          {log.notes ? ` · ${log.notes}` : ""}
        </li>
      ))}
    </ul>
  )
}

export function TutorStudentHub({
  student,
  lessons,
  assignments,
  resources,
  practiceLogs,
}: {
  student: Student
  lessons: LessonWithTutor[]
  assignments: Assignment[]
  resources: Resource[]
  practiceLogs: PracticeLog[]
}) {
  const { upcoming, past } = partitionLessons(lessons)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Student profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          {student.chapters?.name ? (
            <p>
              <span className="text-muted-foreground">Chapter:</span>{" "}
              {student.chapters.name}
            </p>
          ) : null}
          {student.instrument ? (
            <p>
              <span className="text-muted-foreground">Instrument:</span>{" "}
              {student.instrument}
            </p>
          ) : null}
          {student.skill_level ? (
            <p>
              <span className="text-muted-foreground">Level:</span>{" "}
              {student.skill_level}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schedule a lesson</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentScheduleLessonForm student={student} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentAssignmentForm student={student} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming lessons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcoming.length ? (
            upcoming.map((lesson) => (
              <StudentLessonCard key={lesson.id} lesson={lesson} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming lessons.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past lessons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {past.length ? (
            past.map((lesson) => <StudentLessonCard key={lesson.id} lesson={lesson} />)
          ) : (
            <p className="text-sm text-muted-foreground">No past lessons yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentAssignmentsList assignments={assignments} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add resource</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentResourceForm student={student} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student resources</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentResourcesList resources={resources} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Practice log</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Read-only view of practice the family logs at home.
          </p>
          <StudentPracticeList logs={practiceLogs} />
        </CardContent>
      </Card>
    </div>
  )
}
