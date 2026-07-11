"use client"

import { useState } from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table"
import { CheckCircle2 } from "lucide-react"
import {
  approveVolunteerHours,
  rejectVolunteerHours,
} from "@/app/actions/volunteer-hours"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataTable } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { timeAgo } from "@/lib/utils"
import type { VolunteerHourFormState } from "@/lib/validations/phase45"
import type { VolunteerHour } from "@/types/database"

const CATEGORY_LABELS: Record<string, string> = {
  teaching: "Teaching",
  event_support: "Event support",
  admin_work: "Admin work",
}

const ACTIVITY_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

function formatActivityDate(value: string) {
  return ACTIVITY_DATE_FORMAT.format(new Date(`${value}T00:00:00`))
}

function RejectHourDialog({ hour }: { hour: VolunteerHour }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    async (prev: VolunteerHourFormState, formData: FormData) => {
      const result = await rejectVolunteerHours(prev, formData)
      if (result?.success) {
        toast.success(result.message ?? "Entry rejected.")
        setOpen(false)
      } else if (result?.message) {
        toast.error(result.message)
      }
      return result
    },
    undefined
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive/10"
        >
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject this entry?</DialogTitle>
          <DialogDescription>
            {hour.profiles?.full_name ?? "This volunteer"} will be notified with your
            reason and can log a corrected entry.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="hourId" value={hour.id} />
          <div className="space-y-2">
            <Label htmlFor={`reason-${hour.id}`}>Reason</Label>
            <Textarea
              id={`reason-${hour.id}`}
              name="reason"
              rows={3}
              required
              placeholder="Explain why these hours can't be approved"
            />
            <FormFieldError errors={state?.errors?.reason} />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={pending}
            >
              {pending ? <Spinner size="sm" /> : null}
              {pending ? "Rejecting..." : "Reject entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function buildQueueColumns(): ColumnDef<VolunteerHour>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all pending entries on this page"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select entry"
        />
      ),
      enableSorting: false,
      enableGlobalFilter: false,
      enableHiding: false,
    },
    {
      id: "volunteer",
      header: "Volunteer",
      accessorFn: (row) => row.profiles?.full_name ?? "Volunteer",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.profiles?.full_name ?? "Volunteer"}
        </span>
      ),
    },
    {
      id: "category",
      header: "Category",
      accessorFn: (row) => CATEGORY_LABELS[row.category] ?? row.category,
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <Badge variant="secondary">
          {CATEGORY_LABELS[row.original.category] ?? row.original.category}
        </Badge>
      ),
    },
    {
      id: "hours",
      header: "Hours",
      accessorFn: (row) => row.hours,
      enableGlobalFilter: false,
    },
    {
      id: "activityDate",
      header: "Activity date",
      accessorFn: (row) => row.activity_date,
      enableGlobalFilter: false,
      cell: ({ row }) => formatActivityDate(row.original.activity_date),
    },
    {
      id: "description",
      header: "Description",
      accessorFn: (row) => row.description ?? "",
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) =>
        row.original.description ? (
          <p
            className="max-w-[16rem] truncate text-muted-foreground"
            title={row.original.description}
          >
            {row.original.description}
          </p>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "submitted",
      header: "Submitted",
      accessorFn: (row) => row.created_at,
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{timeAgo(row.original.created_at)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <RejectHourDialog hour={row.original} />
        </div>
      ),
    },
  ]
}

export function VolunteerApprovalQueue({ hours }: { hours: VolunteerHour[] }) {
  const columns = buildQueueColumns()
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const selectedIds = Object.keys(rowSelection)
    .filter((key) => rowSelection[key])
    .map((key) => hours[Number(key)]?.id)
    .filter((id): id is string => Boolean(id))

  async function approveSelected() {
    const count = selectedIds.length
    const formData = new FormData()
    for (const id of selectedIds) formData.append("hourIds", id)
    const result = await approveVolunteerHours(undefined, formData)
    if (result?.success) {
      // The action's partial-success message already carries counts; on a
      // clean batch, prefix how many entries were approved.
      const message = result.message ?? "Hours approved and certificate issued."
      toast.success(
        /^\d/.test(message)
          ? message
          : `${count} ${count === 1 ? "entry" : "entries"} approved — ${message
              .charAt(0)
              .toLowerCase()}${message.slice(1)}`
      )
      setRowSelection({})
    } else if (result?.message) {
      toast.error(result.message)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pending queue</CardTitle>
        <CardDescription>
          Select entries to approve in batch, or reject individually
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={hours}
          searchPlaceholder="Search volunteers..."
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          toolbar={
            <ConfirmDialog
              trigger={
                <Button disabled={selectedIds.length === 0}>
                  {`Approve selected (${selectedIds.length})`}
                </Button>
              }
              title="Approve selected hours?"
              description={`This approves ${selectedIds.length} ${
                selectedIds.length === 1 ? "entry" : "entries"
              } and issues a certificate for the volunteer. This cannot be undone.`}
              confirmLabel="Approve"
              destructive={false}
              onConfirm={approveSelected}
            />
          }
          emptyState={
            <EmptyState
              icon={<CheckCircle2 aria-hidden />}
              title="Queue is clear"
              description="There are no volunteer hours waiting for review right now."
            />
          }
        />
      </CardContent>
    </Card>
  )
}
