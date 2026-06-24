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
import { recordManualDonation } from "@/app/actions/donations"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ManualDonationFormState } from "@/lib/validations/phase6"
import type { Donation, DonationTotals } from "@/types/database"

function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function DonationSummaryCards({ totals }: { totals: DonationTotals }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total raised
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatMoney(totals.totalAmount)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Completed donations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{totals.completedCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Last 30 days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatMoney(totals.last30DaysAmount)}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function DonationsTable({ donations }: { donations: Donation[] }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "donated_at", desc: true },
  ])

  const columns = useMemo<ColumnDef<Donation>[]>(
    () => [
      {
        accessorKey: "donated_at",
        header: "Date",
        cell: ({ row }) => new Date(row.original.donated_at).toLocaleDateString(),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) =>
          formatMoney(Number(row.original.amount), row.original.currency),
      },
      {
        accessorKey: "payer_name",
        header: "Donor",
        cell: ({ row }) =>
          row.original.payer_name ?? row.original.payer_email ?? "Anonymous",
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => row.original.source.replace("_", " "),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.status}</Badge>
        ),
      },
      {
        accessorKey: "recorder_name",
        header: "Recorded by",
        cell: ({ row }) => row.original.recorder_name ?? "PayPal",
      },
    ],
    []
  )

  const table = useReactTable({
    data: donations,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (!donations.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No donations recorded yet. PayPal webhook donations and manual entries appear here.
      </p>
    )
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
                <td key={cell.id} className="px-3 py-2">
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

export function ManualDonationForm() {
  const router = useRouter()
  const [state, setState] = useState<ManualDonationFormState>(undefined)
  const [pending, startTransition] = useTransition()
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (state?.success) router.refresh()
  }, [state?.success, router])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const raw = new FormData(event.currentTarget)
    const formData = new FormData()
    formData.set("amount", String(raw.get("amount") ?? ""))
    formData.set("currency", String(raw.get("currency") ?? "USD"))
    formData.set("donatedAt", String(raw.get("donatedAt") ?? today))
    formData.set("payerName", String(raw.get("payerName") ?? ""))
    formData.set("payerEmail", String(raw.get("payerEmail") ?? ""))
    formData.set("notes", String(raw.get("notes") ?? ""))

    startTransition(async () => {
      setState(await recordManualDonation(undefined, formData))
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
          <FormFieldError errors={state?.errors?.amount} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" name="currency" defaultValue="USD" maxLength={3} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="donatedAt">Donation date</Label>
        <Input id="donatedAt" name="donatedAt" type="date" defaultValue={today} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="payerName">Donor name (optional)</Label>
          <Input id="payerName" name="payerName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payerEmail">Donor email (optional)</Label>
          <Input id="payerEmail" name="payerEmail" type="email" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>
      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Recording..." : "Record manual donation"}
      </Button>
    </form>
  )
}
