"use client"

import { useMemo, useState, useTransition } from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import { CheckCircle2, ClipboardList, ClipboardPlus } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { createAssignment, updateAssignmentStatus } from "@/app/actions/assignments"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
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
import type { Assignment, Student } from "@/types/database"
import type { AssignmentFormState } from "@/lib/validations/phase23"
import { ASSIGNMENT_STATUSES, type AssignmentStatus } from "@/types/enums"

const ASSIGNMENT_STATUS_BADGE: Record<AssignmentStatus, string> = {
  assigned: "bg-warning/15 text-warning border-transparent",
  submitted: "bg-primary/10 text-primary border-transparent",
  completed: "bg-success/15 text-success border-transparent",
}

const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  assigned: "Assigned",
  submitted: "Submitted",
  completed: "Completed",
}

const DUE_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  return (
    <Badge className={ASSIGNMENT_STATUS_BADGE[status]}>
      {ASSIGNMENT_STATUS_LABEL[status]}
    </Badge>
  )
}

export function isOverdue(assignment: Assignment) {
  if (!assignment.due_date || assignment.status === "completed") return false
  // due_date is a date-only string; overdue once that day has fully passed.
  const due = new Date(`${assignment.due_date}T23:59:59`)
  return due.getTime() < Date.now()
}

export function formatDue(dueDate: string) {
  return DUE_DATE_FORMAT.format(new Date(`${dueDate}T12:00:00`))
}

/** "New assignment" Dialog. Pass a single-item `students` array to preselect. */
export function CreateAssignmentDialog({
  students,
  trigger,
}: {
  students: Student[]
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const single = students.length === 1 ? students[0] : null

  const [state, formAction, pending] = useActionState(
    async (prev: AssignmentFormState, formData: FormData) => {
      const result = await createAssignment(prev, formData)
      if (result?.success) {
        toast.success(result.message ?? "Assignment created.")
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
            <ClipboardPlus className="h-4 w-4" aria-hidden />
            New assignment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create assignment</DialogTitle>
          <DialogDescription>
            {single
              ? `Homework for ${single.first_name} ${single.last_name}. The family sees it right away.`
              : "Assign homework to one of your students. The family sees it right away."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {single ? (
            <input type="hidden" name="studentId" value={single.id} />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="assignment-student">Student</Label>
              <Select name="studentId" required>
                <SelectTrigger id="assignment-student">
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
          <div className="space-y-2">
            <Label htmlFor="assignment-title">Title</Label>
            <Input id="assignment-title" name="title" required />
            <FormFieldError errors={state?.errors?.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignment-description">Description</Label>
            <Textarea id="assignment-description" name="description" rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignment-due">Due date (optional)</Label>
            <Input id="assignment-due" name="dueDate" type="date" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner size="sm" /> : null}
              {pending ? "Creating..." : "Create assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MarkSubmittedButton({ assignmentId }: { assignmentId: string }) {
  const [, formAction, pending] = useActionState(
    async (prev: AssignmentFormState, formData: FormData) => {
      const result = await updateAssignmentStatus(prev, formData)
      if (result?.success) toast.success(result.message ?? "Marked submitted.")
      else if (result?.message) toast.error(result.message)
      return result
    },
    undefined
  )

  return (
    <form action={formAction}>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="status" value="submitted" />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? (
          <Spinner size="sm" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        )}
        Mark submitted
      </Button>
    </form>
  )
}

/** Parent view: cards grouped by student, "Mark submitted" on open homework. */
export function ParentAssignmentsView({ assignments }: { assignments: Assignment[] }) {
  const groups = useMemo(() => {
    const byStudent = new Map<string, { name: string; items: Assignment[] }>()
    for (const assignment of assignments) {
      const name = assignment.students
        ? `${assignment.students.first_name} ${assignment.students.last_name}`
        : "Student"
      const group = byStudent.get(assignment.student_id) ?? { name, items: [] }
      group.items.push(assignment)
      byStudent.set(assignment.student_id, group)
    }
    return [...byStudent.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [assignments])

  if (!assignments.length) {
    return (
      <EmptyState
        icon={<ClipboardList aria-hidden />}
        title="No assignments yet"
        description="Homework from your students' tutors will show up here."
      />
    )
  }

  return (
    <div className="space-y-6">
      {groups.map((group, groupIndex) => (
        <section
          key={group.name + groupIndex}
          className="animate-fade-up space-y-3"
          style={{ "--stagger-index": groupIndex } as React.CSSProperties}
        >
          <h2 className="font-serif text-lg font-semibold">{group.name}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {group.items.map((assignment) => {
              const overdue = isOverdue(assignment)
              return (
                <div
                  key={assignment.id}
                  className="flex h-full flex-col rounded-xl border bg-card p-4 text-sm shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground">{assignment.title}</p>
                    <AssignmentStatusBadge status={assignment.status} />
                  </div>
                  {assignment.due_date ? (
                    <p
                      className={
                        overdue
                          ? "mt-1 font-medium text-destructive"
                          : "mt-1 text-muted-foreground"
                      }
                    >
                      Due {formatDue(assignment.due_date)}
                      {overdue ? " · overdue" : ""}
                    </p>
                  ) : null}
                  {assignment.description ? (
                    <p className="mt-2 text-muted-foreground">{assignment.description}</p>
                  ) : null}
                  {assignment.status === "assigned" ? (
                    <div className="mt-3 border-t pt-3">
                      <MarkSubmittedButton assignmentId={assignment.id} />
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

export function AssignmentStatusSelect({ assignment }: { assignment: Assignment }) {
  const [pending, startTransition] = useTransition()

  function handleChange(status: string) {
    if (status === assignment.status) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set("assignmentId", assignment.id)
      formData.set("status", status)
      const result = await updateAssignmentStatus(undefined, formData)
      if (result?.success) toast.success(result.message ?? "Assignment updated.")
      else if (result?.message) toast.error(result.message)
    })
  }

  return (
    <Select value={assignment.status} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger className="h-9 w-[140px]" aria-label="Change assignment status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ASSIGNMENT_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {ASSIGNMENT_STATUS_LABEL[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function buildTutorColumns(): ColumnDef<Assignment>[] {
  return [
    {
      id: "student",
      header: "Student",
      accessorFn: (row) =>
        row.students ? `${row.students.first_name} ${row.students.last_name}` : "",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.students
            ? `${row.original.students.first_name} ${row.original.students.last_name}`
            : "Student"}
        </span>
      ),
    },
    {
      id: "title",
      header: "Title",
      accessorFn: (row) => row.title,
      cell: ({ row }) => (
        <div className="min-w-0 max-w-[280px]">
          <p className="truncate">{row.original.title}</p>
          {row.original.description ? (
            <p className="truncate text-xs text-muted-foreground">
              {row.original.description}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "due",
      header: "Due",
      accessorFn: (row) => row.due_date ?? "",
      enableGlobalFilter: false,
      cell: ({ row }) =>
        row.original.due_date ? (
          <span
            className={isOverdue(row.original) ? "font-medium text-destructive" : undefined}
          >
            {formatDue(row.original.due_date)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (row) => row.status,
      enableGlobalFilter: false,
      cell: ({ row }) => <AssignmentStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <AssignmentStatusSelect assignment={row.original} />
        </div>
      ),
    },
  ]
}

/** Tutor view: sortable/searchable table with inline status updates. */
export function TutorAssignmentsTable({
  assignments,
  students,
}: {
  assignments: Assignment[]
  students: Student[]
}) {
  const columns = buildTutorColumns()

  return (
    <DataTable
      columns={columns}
      data={assignments}
      searchPlaceholder="Search assignments..."
      pageSize={10}
      className="animate-fade-up"
      emptyState={
        <EmptyState
          icon={<ClipboardList aria-hidden />}
          title="No assignments yet"
          description="Create an assignment to give one of your students homework between lessons."
          action={
            students.length ? (
              <CreateAssignmentDialog
                students={students}
                trigger={<Button>New assignment</Button>}
              />
            ) : undefined
          }
        />
      }
    />
  )
}
