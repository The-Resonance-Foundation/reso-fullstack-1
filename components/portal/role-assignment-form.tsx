"use client"

import { useActionState } from "react"
import {
  assignUserRole,
  removeUserRole,
} from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/forms/native-select"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Label } from "@/components/ui/label"
import type { Chapter } from "@/types/database"
import type { PortalMember } from "@/lib/auth/dal"
import { APP_ROLES } from "@/types/enums"
import { ROLE_LABELS } from "@/types/roles"

const ASSIGNABLE_ROLES = APP_ROLES.filter(
  (role) => role !== "board_of_director"
)

export function AssignRoleForm({
  chapters,
  members,
}: {
  chapters: Chapter[]
  members: PortalMember[]
}) {
  const [state, action, pending] = useActionState(assignUserRole, undefined)

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userId">Member</Label>
        <NativeSelect id="userId" name="userId" required defaultValue="">
          <option value="" disabled>
            Select member
          </option>
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.fullName}
              {member.email ? ` (${member.email})` : ""}
            </option>
          ))}
        </NativeSelect>
        <FormFieldError errors={state?.errors?.userId} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <NativeSelect id="role" name="role" required defaultValue="">
          <option value="" disabled>
            Select role
          </option>
          {ASSIGNABLE_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </NativeSelect>
        <FormFieldError errors={state?.errors?.role} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="chapterId">Chapter (for chapter roles)</Label>
        <NativeSelect id="chapterId" name="chapterId" defaultValue="">
          <option value="">Organization-wide / none</option>
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || members.length === 0}>
        {pending ? "Assigning..." : "Assign role"}
      </Button>
    </form>
  )
}

export function RemoveRoleButton({ userRoleId }: { userRoleId: string }) {
  const [state, action, pending] = useActionState(removeUserRole, undefined)

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Remove this role assignment?")) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="userRoleId" value={userRoleId} />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="border-destructive text-destructive hover:bg-destructive/10"
        disabled={pending}
      >
        {pending ? "Removing..." : "Remove"}
      </Button>
      {state?.message ? (
        <p className={`mt-1 text-xs ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
