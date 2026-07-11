"use client"

import { useState } from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"
import { assignUserRole, type AdminActionState } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import type { Chapter } from "@/types/database"
import type { PortalMember } from "@/lib/auth/dal"
import { APP_ROLES, type AppRole } from "@/types/enums"
import { ROLE_LABELS } from "@/types/roles"

const ASSIGNABLE_ROLES = APP_ROLES.filter(
  (role) => role !== "board_of_director"
)

/**
 * Roles that require a chapter to be selected. Mirrors CHAPTER_SCOPED_ROLES in
 * app/actions/admin.ts — kept in sync manually since a "use server" module can
 * only export async functions.
 */
const CHAPTER_SCOPED_ROLES: AppRole[] = [
  "student_parent",
  "tutor",
  "volunteer",
  "chapter_officer",
  "chapter_president",
]

type AssignRoleDialogProps = {
  chapters: Chapter[]
  members: PortalMember[]
  /** Render a custom trigger (e.g. for an empty-state CTA). Defaults to a primary button. */
  trigger?: React.ReactNode
}

export function AssignRoleDialog({
  chapters,
  members,
  trigger,
}: AssignRoleDialogProps) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<AppRole | "">("")
  const needsChapter = role !== "" && CHAPTER_SCOPED_ROLES.includes(role)

  const [state, formAction, pending] = useActionState(
    async (prev: AdminActionState, formData: FormData) => {
      const result = await assignUserRole(prev, formData)
      if (result?.success) {
        toast.success(result.message ?? "Role assigned.")
        setOpen(false)
        setRole("")
      } else if (result?.message) {
        toast.error(result.message)
      }
      return result
    },
    undefined
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setRole("")
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <UserPlus className="h-4 w-4" aria-hidden />
            Assign role
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a role</DialogTitle>
          <DialogDescription>
            Grant a member a chapter or organization-wide role.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">Member</Label>
            <Select name="userId" required disabled={members.length === 0}>
              <SelectTrigger id="userId">
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.fullName}
                    {member.email ? ` (${member.email})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormFieldError errors={state?.errors?.userId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              name="role"
              required
              value={role}
              onValueChange={(value) => setRole(value as AppRole)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((assignableRole) => (
                  <SelectItem key={assignableRole} value={assignableRole}>
                    {ROLE_LABELS[assignableRole]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormFieldError errors={state?.errors?.role} />
          </div>

          {needsChapter ? (
            <div className="space-y-2">
              <Label htmlFor="chapterId">Chapter</Label>
              <Select name="chapterId" required>
                <SelectTrigger id="chapterId">
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {chapter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormFieldError errors={state?.errors?.chapterId} />
            </div>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={pending || members.length === 0}>
              {pending ? <Spinner size="sm" /> : null}
              {pending ? "Assigning..." : "Assign role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
