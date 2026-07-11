"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { acceptStudent, rejectStudent } from "@/app/actions/student-review"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

type StudentReviewActionsProps = {
  studentId: string
  status: string
  studentName: string
}

export function StudentReviewActions({
  studentId,
  status,
  studentName,
}: StudentReviewActionsProps) {
  const [acceptPending, startAcceptTransition] = useTransition()

  if (status !== "pending") return null

  function buildFormData() {
    const formData = new FormData()
    formData.set("studentId", studentId)
    return formData
  }

  function handleAccept() {
    startAcceptTransition(async () => {
      const result = await acceptStudent(undefined, buildFormData())
      if (result?.success) {
        toast.success(result.message ?? `${studentName} accepted.`)
      } else if (result?.message) {
        toast.error(result.message)
      }
    })
  }

  async function handleReject() {
    const result = await rejectStudent(undefined, buildFormData())
    if (result?.success) {
      toast.success(result.message ?? `${studentName} rejected.`)
    } else if (result?.message) {
      toast.error(result.message)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" disabled={acceptPending} onClick={handleAccept}>
        {acceptPending ? "Accepting..." : "Accept"}
      </Button>
      <ConfirmDialog
        trigger={
          <Button size="sm" variant="outline">
            Reject
          </Button>
        }
        title="Reject student enrollment"
        description={`This rejects ${studentName}'s enrollment and notifies the parent by email when Resend is configured.`}
        confirmLabel="Reject"
        onConfirm={handleReject}
      />
    </div>
  )
}
