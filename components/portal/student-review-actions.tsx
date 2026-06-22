"use client"

import { useActionState } from "react"
import { acceptStudent, rejectStudent } from "@/app/actions/student-review"
import { Button } from "@/components/ui/button"

function ActionMessage({
  state,
}: {
  state: { message?: string; success?: boolean } | undefined
}) {
  if (!state?.message) return null
  return (
    <p
      className={`mt-2 text-xs ${state.success ? "text-primary" : "text-destructive"}`}
    >
      {state.message}
    </p>
  )
}

export function StudentReviewActions({
  studentId,
  status,
}: {
  studentId: string
  status: string
}) {
  const [acceptState, acceptAction, acceptPending] = useActionState(
    acceptStudent,
    undefined
  )
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectStudent,
    undefined
  )

  if (status !== "pending") return null

  const busy = acceptPending || rejectPending

  return (
    <div className="flex flex-wrap items-start gap-2 pt-2">
      <form action={acceptAction}>
        <input type="hidden" name="studentId" value={studentId} />
        <Button type="submit" size="sm" disabled={busy}>
          {acceptPending ? "Accepting..." : "Accept"}
        </Button>
        <ActionMessage state={acceptState} />
      </form>

      <form
        action={rejectAction}
        onSubmit={(event) => {
          if (!window.confirm("Reject this student enrollment?")) {
            event.preventDefault()
          }
        }}
      >
        <input type="hidden" name="studentId" value={studentId} />
        <Button type="submit" size="sm" variant="outline" disabled={busy}>
          {rejectPending ? "Rejecting..." : "Reject"}
        </Button>
        <ActionMessage state={rejectState} />
      </form>
    </div>
  )
}
