"use client"

import { useMemo, useState } from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import { Plus, UserCog } from "lucide-react"
import {
  assignTutorToStudent,
  removeTutorAssignment,
} from "@/app/actions/tutor-assignments"
import { FormFieldError } from "@/components/forms/form-field-error"
import { NativeSelect } from "@/components/forms/native-select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataTable } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Label } from "@/components/ui/label"
import { initials, timeAgo } from "@/lib/utils"
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
  onSuccess,
}: {
  students: Student[]
  tutors: TutorOption[]
  onSuccess?: () => void
}) {
  const [studentId, setStudentId] = useState("")
  const [tutorUserId, setTutorUserId] = useState("")

  const selectedStudent = students.find((s) => s.id === studentId)
  const eligibleTutors = selectedStudent
    ? tutors.filter((t) => t.chapter_id === selectedStudent.chapter_id)
    : tutors

  const [state, action, pending] = useActionState(
    async (prevState: TutorAssignmentFormState, formData: FormData) => {
      const result = await assignTutorToStudent(prevState, formData)
      if (result?.success) {
        toast.success(result.message ?? "Tutor assigned.")
        setStudentId("")
        setTutorUserId("")
        onSuccess?.()
      } else if (result?.message) {
        toast.error(result.message)
      }
      return result
    },
    undefined
  )

  function handleStudentChange(nextStudentId: string) {
    setStudentId(nextStudentId)
    // Reset the tutor pick if it isn't eligible for the new student's chapter.
    const nextStudent = students.find((s) => s.id === nextStudentId)
    if (
      tutorUserId &&
      nextStudent &&
      !tutors.some(
        (t) => t.user_id === tutorUserId && t.chapter_id === nextStudent.chapter_id
      )
    ) {
      setTutorUserId("")
    }
  }

  if (!students.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No active students found for your chapter.
      </p>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="studentId">Student</Label>
        <NativeSelect
          id="studentId"
          name="studentId"
          required
          value={studentId}
          onChange={(event) => handleStudentChange(event.target.value)}
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

      <Button
        type="submit"
        disabled={pending || !studentId || !tutorUserId}
        className="w-full sm:w-auto"
      >
        {pending ? "Assigning…" : "Assign tutor"}
      </Button>
    </form>
  )
}

export function AssignTutorDialog({
  students,
  tutors,
}: {
  students: Student[]
  tutors: TutorOption[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus aria-hidden />
          Assign tutor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign tutor</DialogTitle>
          <DialogDescription>
            Connect a tutor with a student they will teach.
          </DialogDescription>
        </DialogHeader>
        <TutorAssignmentForm
          students={students}
          tutors={tutors}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function EndAssignmentButton({ assignmentId }: { assignmentId: string }) {
  async function handleConfirm() {
    const formData = new FormData()
    formData.set("id", assignmentId)
    const result = await removeTutorAssignment(undefined, formData)
    if (result?.success) {
      toast.success(result.message ?? "Tutor assignment ended.")
    } else {
      toast.error(result?.message ?? "Couldn't end this assignment.")
    }
  }

  return (
    <ConfirmDialog
      trigger={
        <Button type="button" size="sm" variant="outline">
          End assignment
        </Button>
      }
      title="End this tutor assignment?"
      description="The tutor will no longer see this student's lessons or be able to schedule new ones."
      confirmLabel="End assignment"
      onConfirm={handleConfirm}
    />
  )
}

export function TutorAssignmentsList({
  assignments,
}: {
  assignments: StudentTutorAssignment[]
}) {
  const columns = useMemo<ColumnDef<StudentTutorAssignment>[]>(
    () => [
      {
        id: "student",
        header: "Student",
        accessorFn: (row) =>
          `${row.students?.first_name ?? ""} ${row.students?.last_name ?? ""}`.trim(),
        cell: ({ row }) => {
          const name =
            `${row.original.students?.first_name ?? ""} ${row.original.students?.last_name ?? ""}`.trim() ||
            "Student"
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{name}</span>
            </div>
          )
        },
      },
      {
        id: "tutor",
        header: "Tutor",
        accessorFn: (row) => row.profiles?.full_name ?? "Tutor",
      },
      {
        id: "chapter",
        header: "Chapter",
        accessorFn: (row) => row.chapters?.name ?? "—",
      },
      {
        id: "since",
        header: "Since",
        accessorFn: (row) => row.created_at,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{timeAgo(row.original.created_at)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <EndAssignmentButton assignmentId={row.original.id} />,
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      data={assignments}
      searchPlaceholder="Search assignments…"
      emptyState={
        <EmptyState
          icon={<UserCog aria-hidden />}
          title="No tutor assignments yet"
          description="Assign a tutor to a student to get started."
        />
      }
    />
  )
}
