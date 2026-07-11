"use client"

import { useActionState, useMemo, useState } from "react"
import { Plus, ScrollText } from "lucide-react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import { createAuditLogNote } from "@/app/actions/audit-logs"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Badge } from "@/components/ui/badge"
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
import { DataTable } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { timeAgo } from "@/lib/utils"
import type { AuditLogNoteFormState } from "@/lib/validations/phase6"
import type { AuditLog } from "@/types/database"

export type AuditLogRow = AuditLog & { chapter_name: string | null }

/** "donation_manual" -> "Donation manual" */
function humanizeSlug(value: string): string {
  const words = value.split("_")
  return words
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word
    )
    .join(" ")
}

/* ------------------------------------------------------------------ */

export function AuditLogsDataTable({ logs }: { logs: AuditLogRow[] }) {
  const columns = useMemo<ColumnDef<AuditLogRow>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: "Time",
        cell: ({ row }) => (
          <span title={new Date(row.original.created_at).toLocaleString()}>
            {timeAgo(row.original.created_at)}
          </span>
        ),
      },
      {
        accessorKey: "actor_name",
        header: "Actor",
        cell: ({ row }) => row.original.actor_name ?? "System",
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => <Badge variant="outline">{humanizeSlug(row.original.action)}</Badge>,
      },
      {
        accessorKey: "summary",
        header: "Summary",
        cell: ({ row }) => (
          <div className="max-w-md whitespace-normal">{row.original.summary}</div>
        ),
      },
      {
        accessorKey: "chapter_name",
        header: "Chapter",
        cell: ({ row }) => row.original.chapter_name ?? "Org-wide",
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      data={logs}
      searchPlaceholder="Search audit log..."
      pageSize={10}
      emptyState={
        <EmptyState
          icon={<ScrollText aria-hidden />}
          title="No audit log entries yet"
          description="Donations, role changes, and compliance notes will appear here."
        />
      }
    />
  )
}

/* ------------------------------------------------------------------ */

export function AuditNoteDialog() {
  const [open, setOpen] = useState(false)

  const [state, formAction, pending] = useActionState<AuditLogNoteFormState, FormData>(
    async (prevState, formData) => {
      const result = await createAuditLogNote(prevState, formData)
      if (result?.success) {
        toast.success(result.message ?? "Audit note added.")
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
        <Button size="sm">
          <Plus aria-hidden />
          Add note
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add audit note</DialogTitle>
          <DialogDescription>
            Program administrators and board members can append compliance notes.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="summary">Note</Label>
            <Textarea
              id="summary"
              name="summary"
              rows={4}
              required
              placeholder="Describe the compliance review, follow-up, or internal note..."
            />
            <FormFieldError errors={state?.errors?.summary} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Add note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
