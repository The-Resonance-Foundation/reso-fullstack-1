"use client"

import { useActionState } from "react"
import {
  acceptAndProvisionApplicant,
  rejectApplicant,
  type ProvisionState,
} from "@/app/actions/provision"
import {
  deleteApplicant,
  type MemberActionState,
} from "@/app/actions/member-management"
import { Button } from "@/components/ui/button"
import type { ApplicantStage } from "@/types/enums"

function ActionMessage({
  state,
}: {
  state: ProvisionState | MemberActionState
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

function confirmDelete(label: string) {
  return window.confirm(
    `Delete ${label}? This removes the application from the database. This cannot be undone.`
  )
}

type ApplicantManagementActionsProps = {
  applicantId: string
  fullName: string
  stage: ApplicantStage
}

export function ApplicantManagementActions({
  applicantId,
  fullName,
  stage,
}: ApplicantManagementActionsProps) {
  const [acceptState, acceptAction, acceptPending] = useActionState(
    acceptAndProvisionApplicant,
    undefined
  )
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectApplicant,
    undefined
  )
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteApplicant,
    undefined
  )

  const busy = acceptPending || rejectPending || deletePending
  const canReview = stage === "applied"

  return (
    <div className="space-y-2 pt-1">
      <div className="flex flex-wrap items-start gap-2">
        {canReview ? (
          <>
            <form action={acceptAction}>
              <input type="hidden" name="applicantId" value={applicantId} />
              <Button type="submit" size="sm" disabled={busy}>
                {acceptPending ? "Accepting..." : "Accept"}
              </Button>
              <ActionMessage state={acceptState} />
            </form>

            <form action={rejectAction}>
              <input type="hidden" name="applicantId" value={applicantId} />
              <Button type="submit" size="sm" variant="outline" disabled={busy}>
                {rejectPending ? "Rejecting..." : "Reject"}
              </Button>
              <ActionMessage state={rejectState} />
            </form>
          </>
        ) : null}

        <form
          action={deleteAction}
          onSubmit={(event) => {
            if (!confirmDelete(`the application for ${fullName}`)) {
              event.preventDefault()
            }
          }}
        >
          <input type="hidden" name="applicantId" value={applicantId} />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            disabled={busy}
          >
            {deletePending ? "Deleting..." : "Delete"}
          </Button>
          <ActionMessage state={deleteState} />
        </form>
      </div>
    </div>
  )
}
