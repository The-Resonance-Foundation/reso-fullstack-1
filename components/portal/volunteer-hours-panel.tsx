"use client"

import { useState } from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import { Clock, Pencil, Trash2 } from "lucide-react"
import {
  deletePendingVolunteerHours,
  submitVolunteerHours,
  updatePendingVolunteerHours,
} from "@/app/actions/volunteer-hours"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import type { VolunteerHourFormState } from "@/lib/validations/phase45"
import type { VolunteerHour } from "@/types/database"
import { VOLUNTEER_HOUR_CATEGORIES, type VolunteerHourStatus } from "@/types/enums"

type ChapterOption = { id: string; name: string }

const CATEGORY_LABELS: Record<string, string> = {
  teaching: "Teaching",
  event_support: "Event support",
  admin_work: "Admin work",
}

const STATUS_BADGE_CLASSES: Record<VolunteerHourStatus, string> = {
  approved: "bg-success/15 text-success border-transparent",
  pending: "bg-warning/15 text-warning border-transparent",
  rejected: "bg-destructive/15 text-destructive border-transparent",
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

function formatActivityDate(value: string) {
  return DATE_FORMAT.format(new Date(`${value}T00:00:00`))
}

export function VolunteerHourForm({ chapters }: { chapters: ChapterOption[] }) {
  const today = new Date().toISOString().slice(0, 10)
  const [state, formAction, pending] = useActionState(
    async (prev: VolunteerHourFormState, formData: FormData) => {
      const result = await submitVolunteerHours(prev, formData)
      if (result?.success) {
        toast.success(result.message ?? "Volunteer hours submitted.")
      } else if (result?.message) {
        toast.error(result.message)
      }
      return result
    },
    undefined
  )

  if (!chapters.length) {
    return (
      <p className="text-sm text-muted-foreground">
        You need an active tutor or volunteer role in a chapter to log hours.
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="chapterId">Chapter</Label>
        <Select name="chapterId" defaultValue={chapters[0]?.id} required>
          <SelectTrigger id="chapterId">
            <SelectValue placeholder="Select chapter" />
          </SelectTrigger>
          <SelectContent>
            {chapters.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormFieldError errors={state?.errors?.chapterId} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue="teaching">
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOLUNTEER_HOUR_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c] ?? c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormFieldError errors={state?.errors?.category} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hours">Hours</Label>
          <Input
            id="hours"
            name="hours"
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            required
          />
          <FormFieldError errors={state?.errors?.hours} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="activityDate">Activity date</Label>
        <Input
          id="activityDate"
          name="activityDate"
          type="date"
          defaultValue={today}
          max={today}
          required
        />
        <FormFieldError errors={state?.errors?.activityDate} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} />
        <FormFieldError errors={state?.errors?.description} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Spinner size="sm" /> : null}
        {pending ? "Submitting..." : "Submit hours"}
      </Button>
    </form>
  )
}

function StatusCell({ hour }: { hour: VolunteerHour }) {
  return (
    <div className="space-y-1">
      <Badge className={STATUS_BADGE_CLASSES[hour.status]}>
        {hour.status.charAt(0).toUpperCase() + hour.status.slice(1)}
      </Badge>
      {hour.status === "rejected" && hour.rejection_reason ? (
        <p
          className="max-w-[16rem] truncate text-xs text-muted-foreground"
          title={hour.rejection_reason}
        >
          {hour.rejection_reason}
        </p>
      ) : null}
    </div>
  )
}

function EditHourDialog({ hour }: { hour: VolunteerHour }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    async (prev: VolunteerHourFormState, formData: FormData) => {
      const result = await updatePendingVolunteerHours(prev, formData)
      if (result?.success) {
        toast.success(result.message ?? "Entry updated.")
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
        <Button size="sm" variant="outline">
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit hours</DialogTitle>
          <DialogDescription>Update this pending entry before it&apos;s reviewed.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={hour.id} />
          <input type="hidden" name="chapterId" value={hour.chapter_id} />
          <div className="space-y-2">
            <Label htmlFor={`category-${hour.id}`}>Category</Label>
            <Select name="category" defaultValue={hour.category}>
              <SelectTrigger id={`category-${hour.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOLUNTEER_HOUR_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c] ?? c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormFieldError errors={state?.errors?.category} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`hours-${hour.id}`}>Hours</Label>
              <Input
                id={`hours-${hour.id}`}
                name="hours"
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                defaultValue={hour.hours}
                required
              />
              <FormFieldError errors={state?.errors?.hours} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`date-${hour.id}`}>Activity date</Label>
              <Input
                id={`date-${hour.id}`}
                name="activityDate"
                type="date"
                defaultValue={hour.activity_date}
                required
              />
              <FormFieldError errors={state?.errors?.activityDate} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`description-${hour.id}`}>Description</Label>
            <Textarea
              id={`description-${hour.id}`}
              name="description"
              rows={2}
              defaultValue={hour.description ?? ""}
            />
            <FormFieldError errors={state?.errors?.description} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner size="sm" /> : null}
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteHourAction({ hour }: { hour: VolunteerHour }) {
  return (
    <ConfirmDialog
      trigger={
        <Button
          size="sm"
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Remove
        </Button>
      }
      title="Remove this entry?"
      description={`This permanently deletes your ${hour.hours}h entry from ${formatActivityDate(hour.activity_date)}.`}
      confirmLabel="Remove"
      onConfirm={async () => {
        const formData = new FormData()
        formData.set("id", hour.id)
        const result = await deletePendingVolunteerHours(undefined, formData)
        if (result?.success) {
          toast.success(result.message ?? "Entry removed.")
        } else if (result?.message) {
          toast.error(result.message)
        }
      }}
    />
  )
}

function buildHistoryColumns(): ColumnDef<VolunteerHour>[] {
  return [
    {
      id: "activityDate",
      header: "Date",
      accessorFn: (row) => row.activity_date,
      cell: ({ row }) => formatActivityDate(row.original.activity_date),
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
      id: "status",
      header: "Status",
      accessorFn: (row) => row.status,
      enableGlobalFilter: false,
      cell: ({ row }) => <StatusCell hour={row.original} />,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) =>
        row.original.status === "pending" ? (
          <div className="flex justify-end gap-2">
            <EditHourDialog hour={row.original} />
            <DeleteHourAction hour={row.original} />
          </div>
        ) : null,
    },
  ]
}

export function VolunteerHoursList({ hours }: { hours: VolunteerHour[] }) {
  const columns = buildHistoryColumns()

  return (
    <DataTable
      columns={columns}
      data={hours}
      emptyState={
        <EmptyState
          icon={<Clock aria-hidden />}
          title="No volunteer hours yet"
          description="Log your first entry above — chapter officers review it before a certificate is issued."
        />
      }
    />
  )
}
