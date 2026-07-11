"use client"

import { useActionState, useState, useTransition } from "react"
import { toast } from "sonner"
import { MoreHorizontal } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { updateApplicantStage } from "@/app/actions/applicant-pipeline"
import { deleteApplicant } from "@/app/actions/member-management"
import {
  acceptAndProvisionApplicant,
  rejectApplicant,
  type ProvisionState,
} from "@/app/actions/provision"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { isValidApplicantStageTransition } from "@/lib/events/helpers"
import { APPLICANT_STAGES, type ApplicantStage } from "@/types/enums"

export const STAGE_LABELS: Record<ApplicantStage, string> = {
  interested: "Interested",
  applied: "Applied",
  accepted: "Accepted",
  active: "Active",
  alumni: "Alumni",
  rejected: "Rejected",
}

function nextStages(current: ApplicantStage): ApplicantStage[] {
  return APPLICANT_STAGES.filter(
    (candidate) =>
      candidate !== current && isValidApplicantStageTransition(current, candidate)
  )
}

type ApplicantActionsProps = {
  applicantId: string
  fullName: string
  stage: ApplicantStage
}

/**
 * Single, coherent set of row actions for the applicant pipeline. Merges
 * what used to be two separate components:
 *  - ApplicantStageActions (generic "move to any valid next stage")
 *  - ApplicantManagementActions (accept/provision, reject, delete)
 *
 * Needs-review rows (interested/applied) get the primary Accept & provision /
 * Reject actions. The dedicated accept/reject server actions only take
 * "applied" applicants, so "interested" rows are first advanced with the
 * existing stage-transition action (a valid interested → applied move) before
 * the review action runs. Every row also gets a menu of remaining valid stage
 * transitions plus Delete, reusing the same transition validation the old
 * stage-actions component relied on.
 */
export function ApplicantActions({ applicantId, fullName, stage }: ApplicantActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [busy, startTransition] = useTransition()

  async function ensureApplied(): Promise<boolean> {
    if (stage !== "interested") return true
    const formData = new FormData()
    formData.set("applicantId", applicantId)
    formData.set("stage", "applied")
    const result = await updateApplicantStage(undefined, formData)
    if (!result?.success) {
      toast.error(result?.message ?? "Could not move applicant to Applied.")
      return false
    }
    return true
  }

  const [, rejectFormAction, rejectPending] = useActionState(
    async (prev: ProvisionState, formData: FormData) => {
      if (!(await ensureApplied())) return prev
      const result = await rejectApplicant(prev, formData)
      if (result?.success) {
        toast.success(result.message ?? `${fullName} rejected.`)
        setRejectOpen(false)
      } else if (result?.message) {
        toast.error(result.message)
      }
      return result
    },
    undefined
  )

  async function handleAccept() {
    if (!(await ensureApplied())) return
    const formData = new FormData()
    formData.set("applicantId", applicantId)
    const result = await acceptAndProvisionApplicant(undefined, formData)
    if (result?.success) {
      toast.success(result.message ?? `${fullName} accepted and provisioned.`)
    } else if (result?.message) {
      toast.error(result.message)
    }
  }

  function handleStageChange(nextStage: ApplicantStage) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set("applicantId", applicantId)
      formData.set("stage", nextStage)
      const result = await updateApplicantStage(undefined, formData)
      if (result?.success) {
        toast.success(result.message ?? `Moved to ${STAGE_LABELS[nextStage]}.`)
      } else if (result?.message) {
        toast.error(result.message)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const formData = new FormData()
      formData.set("applicantId", applicantId)
      const result = await deleteApplicant(undefined, formData)
      if (result?.success) {
        toast.success(result.message ?? `Deleted application for ${fullName}.`)
      } else if (result?.message) {
        toast.error(result.message)
      }
      setDeleteOpen(false)
    })
  }

  // Needs-review rows get the dedicated Accept/Reject flow; all other rows
  // get the dropdown of remaining valid stage transitions plus Delete.
  const isReviewable = stage === "applied" || stage === "interested"
  const transitions = isReviewable ? [] : nextStages(stage)
  const showMenu = !isReviewable

  return (
    <div className="flex items-center justify-end gap-2">
      {isReviewable ? (
        <>
          <ConfirmDialog
            trigger={<Button size="sm">Accept &amp; provision</Button>}
            title="Accept & provision applicant"
            description={`This grants ${fullName} the requested role and provisions their chapter membership immediately. They'll be able to access it right away.`}
            confirmLabel="Accept & provision"
            destructive={false}
            onConfirm={handleAccept}
          />
          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                Reject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form action={rejectFormAction}>
                <input type="hidden" name="applicantId" value={applicantId} />
                <DialogHeader>
                  <DialogTitle>Reject application</DialogTitle>
                  <DialogDescription>
                    {fullName} will receive a rejection notification email when Resend is
                    configured. This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-2">
                  <Textarea
                    name="reason"
                    rows={3}
                    placeholder="Reason (optional)"
                    aria-label="Rejection reason (optional)"
                  />
                </div>
                <DialogFooter className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRejectOpen(false)}
                    disabled={rejectPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={rejectPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {rejectPending ? <Spinner size="sm" /> : null}
                    {rejectPending ? "Rejecting..." : "Reject"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      ) : null}

      {showMenu ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More actions" disabled={busy}>
              <MoreHorizontal className="h-4 w-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {transitions.map((candidate) => (
              <DropdownMenuItem
                key={candidate}
                onSelect={() => handleStageChange(candidate)}
              >
                Move to {STAGE_LABELS[candidate]}
              </DropdownMenuItem>
            ))}
            {transitions.length > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                setDeleteOpen(true)
              }}
              className="text-destructive focus:text-destructive"
            >
              Delete application
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <AlertDialog open={deleteOpen} onOpenChange={(next) => !busy && setDeleteOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete application</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the application for {fullName}
              {stage === "active" || stage === "accepted"
                ? ", their role, and their portal account if they have no other roles"
                : ""}
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={busy}
              onClick={handleDelete}
            >
              {busy ? <Spinner size="sm" /> : null}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
