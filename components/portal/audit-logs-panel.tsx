"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { createAuditLogNote } from "@/app/actions/audit-logs"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AuditLogNoteFormState } from "@/lib/validations/phase6"
import type { AuditLog } from "@/types/database"

export function AuditLogsTable({ logs }: { logs: AuditLog[] }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ])

  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: "When",
        cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.action.replace(/_/g, " ")}</Badge>
        ),
      },
      {
        accessorKey: "summary",
        header: "Summary",
        cell: ({ row }) => row.original.summary,
      },
      {
        accessorKey: "actor_name",
        header: "Actor",
        cell: ({ row }) => row.original.actor_name ?? "System",
      },
    ],
    []
  )

  const table = useReactTable({
    data: logs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (!logs.length) {
    return <p className="text-sm text-muted-foreground">No audit log entries yet.</p>
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-3 py-2 text-left font-medium">
                  {header.isPlaceholder ? null : (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: " ↑",
                        desc: " ↓",
                      }[header.column.getIsSorted() as string] ?? null}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2 align-top">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AuditNoteForm() {
  const router = useRouter()
  const [state, setState] = useState<AuditLogNoteFormState>(undefined)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (state?.success) router.refresh()
  }, [state?.success, router])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const raw = new FormData(event.currentTarget)
    const formData = new FormData()
    formData.set("summary", String(raw.get("summary") ?? ""))

    startTransition(async () => {
      setState(await createAuditLogNote(undefined, formData))
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="summary">Audit note</Label>
        <Textarea
          id="summary"
          name="summary"
          rows={4}
          required
          placeholder="Describe the compliance review, follow-up, or internal note..."
        />
        <FormFieldError errors={state?.errors?.summary} />
      </div>
      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Add audit note"}
      </Button>
    </form>
  )
}
