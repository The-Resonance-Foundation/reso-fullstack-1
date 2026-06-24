"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  assignTutorToStudent,
  removeTutorAssignment,
} from "@/app/actions/tutor-assignments"
import { FormFieldError } from "@/components/forms/form-field-error"
import { NativeSelect } from "@/components/forms/native-select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { TutorAssignmentFormState } from "@/lib/validations/phase23"
import type { Student, StudentTutorAssignment } from "@/types/database"

type TutorOption = {
  user_id: string
  chapter_id: string | null
  profiles: { full_name: string } | null
  chapters: { name: string } | null
}

export function TutorAssignmentForm({
  students,
  tutors,
}: {
  students: Student[]
  tutors: TutorOption[]
}) {
  const router = useRouter()
  const [state, setState] = useState<TutorAssignmentFormState>(undefined)
  const [pending, startTransition] = useTransition()
  const [studentId, setStudentId] = useState("")
  const [tutorUserId, setTutorUserId] = useState("")

  const selectedStudent = students.find((s) => s.id === studentId)
  const eligibleTutors = selectedStudent
    ? tutors.filter((t) => t.chapter_id === selectedStudent.chapter_id)
    : tutors

  useEffect(() => {
    if (!state?.success) return
    setStudentId("")
    setTutorUserId("")
    router.refresh()
  }, [state?.success, router])

  useEffect(() => {
    if (!tutorUserId) return
    if (!eligibleTutors.some((t) => t.user_id === tutorUserId)) {
      setTutorUserId("")
    }
  }, [studentId, eligibleTutors, tutorUserId])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const raw = new FormData(event.currentTarget)
    const nextStudentId = String(raw.get("studentId") ?? studentId)
    const nextTutorUserId = String(raw.get("tutorUserId") ?? tutorUserId)

    if (!nextStudentId || !nextTutorUserId) {
      setState({ message: "Please select both a student and a tutor." })
      return
    }

    const formData = new FormData()
    formData.set("studentId", nextStudentId)
    formData.set("tutorUserId", nextTutorUserId)

    startTransition(async () => {
      const result = await assignTutorToStudent(undefined, formData)
      setState(result)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="studentId">Student</Label>
        <NativeSelect
          id="studentId"
          name="studentId"
          required
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
        >
          <option value="" disabled>
            Select student
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.first_name} {s.last_name} · {s.chapters?.name}
            </option>
          ))}
        </NativeSelect>
        <FormFieldError errors={state?.errors?.studentId} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tutorUserId">Tutor</Label>
        <NativeSelect
          id="tutorUserId"
          name="tutorUserId"
          required
          value={tutorUserId}
          onChange={(event) => setTutorUserId(event.target.value)}
          disabled={!studentId}
        >
          <option value="" disabled>
            {studentId ? "Select tutor" : "Select a student first"}
          </option>
          {eligibleTutors.map((t) => (
            <option key={`${t.user_id}:${t.chapter_id}`} value={t.user_id}>
              {t.profiles?.full_name ?? t.user_id}
              {t.chapters?.name ? ` · ${t.chapters.name}` : ""}
            </option>
          ))}
        </NativeSelect>
        <FormFieldError errors={state?.errors?.tutorUserId} />
        {studentId && eligibleTutors.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No active tutors in this student&apos;s chapter. Accept tutor applicants
            first on the Applicants page.
          </p>
        ) : null}
        {!studentId && tutors.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No active tutors found for your chapter. Accept tutor applicants first
            on the Applicants page.
          </p>
        ) : null}
      </div>

      {state?.message ? (
        <p
          className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || !studentId || !tutorUserId}>
        {pending ? "Assigning..." : "Assign tutor"}
      </Button>
    </form>
  )
}

export function TutorAssignmentsList({
  assignments,
}: {
  assignments: StudentTutorAssignment[]
}) {
  const router = useRouter()
  const [state, setState] = useState<TutorAssignmentFormState>(undefined)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (state?.success) {
      router.refresh()
    }
  }, [state?.success, router])

  function handleRemove(assignmentId: string) {
    const formData = new FormData()
    formData.set("id", assignmentId)

    startTransition(async () => {
      const result = await removeTutorAssignment(undefined, formData)
      setState(result)
    })
  }

  if (!assignments.length) {
    return (
      <p className="text-sm text-muted-foreground">No tutor assignments yet.</p>
    )
  }

  return (
    <ul className="space-y-2">
      {assignments.map((a) => (
        <li
          key={a.id}
          className="flex items-center justify-between rounded-md border p-3 text-sm"
        >
          <span>
            {a.students?.first_name} {a.students?.last_name}
            {" → "}
            {a.profiles?.full_name ?? "Tutor"}
            {a.chapters?.name ? ` · ${a.chapters.name}` : ""}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => handleRemove(a.id)}
          >
            Remove
          </Button>
        </li>
      ))}
      {state?.message ? (
        <p
          className={`text-xs ${state.success ? "text-primary" : "text-destructive"}`}
        >
          {state.message}
        </p>
      ) : null}
    </ul>
  )
}
