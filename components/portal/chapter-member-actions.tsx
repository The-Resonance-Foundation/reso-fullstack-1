"use client"

import { useActionState } from "react"
import {
  deleteTutor,
  deleteVolunteer,
  type MemberActionState,
} from "@/app/actions/member-management"
import { Button } from "@/components/ui/button"

function ActionMessage({ state }: { state: MemberActionState }) {
  if (!state?.message) return null
  return (
    <p
      className={`mt-2 text-xs ${state.success ? "text-primary" : "text-destructive"}`}
    >
      {state.message}
    </p>
  )
}

type ChapterMemberActionsProps = {
  userRoleId: string
  fullName: string
  memberType: "tutor" | "volunteer"
}

export function ChapterMemberActions({
  userRoleId,
  fullName,
  memberType,
}: ChapterMemberActionsProps) {
  const action = memberType === "tutor" ? deleteTutor : deleteVolunteer
  const [deleteState, deleteAction, deletePending] = useActionState(action, undefined)
  const label = memberType === "tutor" ? "tutor" : "volunteer"

  return (
    <form
      action={deleteAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Delete ${label} ${fullName}? This removes their role, linked application, and their portal account if they have no other roles.`
        )
        if (!confirmed) event.preventDefault()
      }}
    >
      <input type="hidden" name="userRoleId" value={userRoleId} />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="border-destructive text-destructive hover:bg-destructive/10"
        disabled={deletePending}
      >
        {deletePending ? "Deleting..." : `Delete ${label}`}
      </Button>
      <ActionMessage state={deleteState} />
    </form>
  )
}
