"use client"

import { useActionState } from "react"
import { createAssignment, updateAssignmentStatus } from "@/app/actions/assignments"
import { FormFieldError } from "@/components/forms/form-field-error"
import { NativeSelect } from "@/components/forms/native-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Assignment, Student } from "@/types/database"

export function AssignmentForm({ students }: { students: Student[] }) {
  const [state, action, pending] = useActionState(createAssignment, undefined)

  if (!students.length) {
    return <p className="text-sm text-muted-foreground">No assigned students.</p>
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="studentId">Student</Label>
        <NativeSelect id="studentId" name="studentId" required defaultValue="">
          <option value="" disabled>Select student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.first_name} {s.last_name}
            </option>
          ))}
        </NativeSelect>
      </div>
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
      <Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create assignment"}</Button>
    </form>
  )
}

export function AssignmentsList({
  assignments,
  isParent,
}: {
  assignments: Assignment[]
  isParent: boolean
}) {
  const [state, action, pending] = useActionState(updateAssignmentStatus, undefined)

  if (!assignments.length) {
    return <p className="text-sm text-muted-foreground">No assignments yet.</p>
  }

  return (
    <ul className="space-y-3">
      {assignments.map((a) => (
        <li key={a.id} className="rounded-md border p-4 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{a.title}</p>
              <p className="text-muted-foreground">
                {a.students?.first_name} {a.students?.last_name}
                {a.due_date ? ` · Due ${a.due_date}` : ""}
              </p>
              {a.description ? <p className="mt-1">{a.description}</p> : null}
            </div>
            <Badge variant="outline">{a.status}</Badge>
          </div>
          {isParent && a.status === "assigned" ? (
            <form action={action} className="mt-2">
              <input type="hidden" name="assignmentId" value={a.id} />
              <input type="hidden" name="status" value="submitted" />
              <Button type="submit" size="sm" disabled={pending}>Mark submitted</Button>
            </form>
          ) : null}
        </li>
      ))}
      {state?.message ? (
        <p className={`text-xs ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
    </ul>
  )
}
