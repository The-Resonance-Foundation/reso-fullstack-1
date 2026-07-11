"use client"

import Link from "next/link"
import { useState } from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import {
  ArrowRight,
  ClipboardList,
  FolderOpen,
  FolderPlus,
  Music,
  Timer,
  Users,
} from "lucide-react"
import { addResource } from "@/app/actions/resources"
import {
  AssignmentStatusBadge,
  AssignmentStatusSelect,
  CreateAssignmentDialog,
  formatDue,
  isOverdue,
} from "@/components/portal/assignments-panel"
import { LessonsView, ScheduleLessonDialog } from "@/components/portal/lessons-panel"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { initials } from "@/lib/utils"
import type { ResourceFormState } from "@/lib/validations/phase23"
import type {
  Assignment,
  LessonWithTutor,
  PracticeLog,
  Resource,
  Student,
} from "@/types/database"
import { RESOURCE_STORAGE_TYPES } from "@/types/enums"

export type AssignedStudentCard = {
  student: Student
  upcomingCount: number
  nextLessonAt: string | null
}

const NEXT_LESSON_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

export function AssignedStudentsList({ items }: { items: AssignedStudentCard[] }) {
  if (!items.length) {
    return (
      <EmptyState
        icon={<Users aria-hidden />}
        title="No students assigned to you yet"
        description="A chapter officer connects tutors and students. Once assigned, each student appears here with their own lesson hub."
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ student, upcomingCount, nextLessonAt }, index) => (
        <Link
          key={student.id}
          href={`/dashboard/tutor/students/${student.id}`}
          className="animate-fade-up group flex flex-col rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ "--stagger-index": index } as React.CSSProperties}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {initials(`${student.first_name} ${student.last_name}`)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {student.first_name} {student.last_name}
                </p>
                {student.instrument ? (
                  <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                    <Music className="h-3 w-3 shrink-0" aria-hidden />
                    {student.instrument}
                  </p>
                ) : null}
              </div>
            </div>
            {student.skill_level ? (
              <Badge variant="secondary" className="shrink-0 capitalize">
                {student.skill_level}
              </Badge>
            ) : null}
          </div>

          <div className="mt-4 space-y-1 text-sm text-muted-foreground">
            {student.chapters?.name ? <p>{student.chapters.name}</p> : null}
            {upcomingCount > 0 && nextLessonAt ? (
              <p>
                <span className="font-medium text-foreground">
                  {upcomingCount} upcoming lesson{upcomingCount === 1 ? "" : "s"}
                </span>
                {" · next "}
                {NEXT_LESSON_FORMAT.format(new Date(nextLessonAt))}
              </p>
            ) : (
              <p>No upcoming lessons</p>
            )}
          </div>

          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
            Open hub
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </Link>
      ))}
    </div>
  )
}

function AddResourceDialog({ student }: { student: Student }) {
  const [open, setOpen] = useState(false)

  const [state, formAction, pending] = useActionState(
    async (prev: ResourceFormState, formData: FormData) => {
      const result = await addResource(prev, formData)
      if (result?.success) {
        toast.success(result.message ?? "Resource added.")
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
          <FolderPlus className="h-3.5 w-3.5" aria-hidden />
          Add resource
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a resource</DialogTitle>
          <DialogDescription>
            Share sheet music or practice material with {student.first_name}&apos;s family.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="chapterId" value={student.chapter_id} />
          <input type="hidden" name="studentId" value={student.id} />
          <div className="space-y-2">
            <Label htmlFor="resource-title">Title</Label>
            <Input id="resource-title" name="title" required />
            <FormFieldError errors={state?.errors?.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resource-description">Description</Label>
            <Textarea id="resource-description" name="description" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resource-type">Type</Label>
            <Select name="storageType" defaultValue="link">
              <SelectTrigger id="resource-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_STORAGE_TYPES.filter((type) => type !== "supabase").map(
                  (type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resource-url">URL</Label>
            <Input
              id="resource-url"
              name="url"
              type="url"
              placeholder="https://..."
              required
            />
            <FormFieldError errors={state?.errors?.url} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner size="sm" /> : null}
              {pending ? "Adding..." : "Add resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StudentAssignmentsList({ assignments }: { assignments: Assignment[] }) {
  if (!assignments.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No assignments yet. Create one to give this student homework between lessons.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {assignments.map((assignment) => {
        const overdue = isOverdue(assignment)
        return (
          <li key={assignment.id} className="rounded-lg border p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{assignment.title}</p>
                {assignment.due_date ? (
                  <p
                    className={
                      overdue ? "font-medium text-destructive" : "text-muted-foreground"
                    }
                  >
                    Due {formatDue(assignment.due_date)}
                    {overdue ? " · overdue" : ""}
                  </p>
                ) : null}
                {assignment.description ? (
                  <p className="mt-1 text-muted-foreground">{assignment.description}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <AssignmentStatusBadge status={assignment.status} />
                <AssignmentStatusSelect assignment={assignment} />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function StudentResourcesList({ resources }: { resources: Resource[] }) {
  if (!resources.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No resources shared with this student yet.
      </p>
    )
  }

  return (
    <ul className="space-y-2.5">
      {resources.map((resource) => (
        <li key={resource.id} className="rounded-lg border p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 truncate font-medium text-foreground">
              {resource.title}
            </p>
            <Badge variant="secondary" className="shrink-0 capitalize">
              {resource.storage_type}
            </Badge>
          </div>
          {resource.description ? (
            <p className="mt-1 text-muted-foreground">{resource.description}</p>
          ) : null}
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

const PRACTICE_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
})

function StudentPracticeSummary({ logs }: { logs: PracticeLog[] }) {
  if (!logs.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No practice logged by the family yet.
      </p>
    )
  }

  const totalMinutes = logs.reduce((sum, log) => sum + log.minutes, 0)

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{totalMinutes} min</span> across
        the last {logs.length} session{logs.length === 1 ? "" : "s"}
      </p>
      <ul className="space-y-2">
        {logs.map((log) => (
          <li
            key={log.id}
            className="flex items-start justify-between gap-2 rounded-lg border p-3 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground">
                {PRACTICE_DATE_FORMAT.format(new Date(`${log.practiced_on}T12:00:00`))}
              </p>
              {log.notes ? (
                <p className="truncate text-muted-foreground">{log.notes}</p>
              ) : null}
            </div>
            <Badge variant="secondary" className="shrink-0">
              {log.minutes} min
            </Badge>
          </li>
        ))}
      </ul>
    </div>
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
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: lessons + assignments */}
      <div className="space-y-6 lg:col-span-2">
        <Card className="animate-fade-up">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">Lessons</CardTitle>
              <CardDescription>
                Log attendance or update status after each lesson.
              </CardDescription>
            </div>
            <ScheduleLessonDialog
              students={[student]}
              trigger={
                <Button size="sm" variant="outline">
                  Schedule lesson
                </Button>
              }
            />
          </CardHeader>
          <CardContent>
            <LessonsView
              lessons={lessons}
              perspective="tutor"
              emptyState={
                <EmptyState
                  icon={<ClipboardList aria-hidden />}
                  title="No lessons with this student yet"
                  description="Schedule the first lesson to get started."
                  action={
                    <ScheduleLessonDialog
                      students={[student]}
                      trigger={<Button>Schedule lesson</Button>}
                    />
                  }
                />
              }
            />
          </CardContent>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">Assignments</CardTitle>
              <CardDescription>
                Homework for {student.first_name} — the family sees updates instantly.
              </CardDescription>
            </div>
            <CreateAssignmentDialog
              students={[student]}
              trigger={
                <Button size="sm" variant="outline">
                  New assignment
                </Button>
              }
            />
          </CardHeader>
          <CardContent>
            <StudentAssignmentsList assignments={assignments} />
          </CardContent>
        </Card>
      </div>

      {/* Right: practice + resources */}
      <div className="space-y-6">
        <Card className="animate-fade-up">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Timer className="h-4 w-4 text-primary" aria-hidden />
              Practice
            </CardTitle>
            <CardDescription>
              Read-only view of practice the family logs at home.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudentPracticeSummary logs={practiceLogs} />
          </CardContent>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderOpen className="h-4 w-4 text-primary" aria-hidden />
              Resources
            </CardTitle>
            <AddResourceDialog student={student} />
          </CardHeader>
          <CardContent>
            <StudentResourcesList resources={resources} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
