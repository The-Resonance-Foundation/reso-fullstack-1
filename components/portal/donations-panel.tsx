"use client"

import { useActionState, useMemo, useState } from "react"
import { Coins, Plus } from "lucide-react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import { recordManualDonation } from "@/app/actions/donations"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ManualDonationFormState } from "@/lib/validations/phase6"
import type { Donation } from "@/types/database"

const STATUS_BADGE_CLASS: Record<string, string> = {
  completed: "border-transparent bg-success/15 text-success",
  pending: "border-transparent bg-warning/15 text-warning",
  refunded: "border-transparent bg-destructive/15 text-destructive",
  reversed: "border-transparent bg-destructive/15 text-destructive",
}

const SOURCE_LABEL: Record<string, string> = {
  paypal_webhook: "PayPal",
  manual: "Manual",
}

function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

/* ------------------------------------------------------------------ */

export function DonationsDataTable({ donations }: { donations: Donation[] }) {
  const columns = useMemo<ColumnDef<Donation>[]>(
    () => [
      {
        id: "donor",
        header: "Donor",
        accessorFn: (row) =>
          `${row.payer_name ?? ""} ${row.payer_email ?? ""}`.trim() || "Anonymous",
        cell: ({ row }) => {
          const { payer_name, payer_email } = row.original
          if (!payer_name && !payer_email) {
            return <span className="text-muted-foreground">Anonymous</span>
          }
          return (
            <div className="min-w-0">
              {payer_name ? (
                <p className="truncate font-medium">{payer_name}</p>
              ) : null}
              {payer_email ? (
                <p className="truncate text-xs text-muted-foreground">{payer_email}</p>
              ) : null}
            </div>
          )
        },
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium tabular-nums">
            {formatMoney(Number(row.original.amount), row.original.currency)}
          </div>
        ),
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {SOURCE_LABEL[row.original.source] ?? row.original.source}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={STATUS_BADGE_CLASS[row.original.status] ?? ""}
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "donated_at",
        header: "Date",
        cell: ({ row }) => new Date(row.original.donated_at).toLocaleDateString(),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => (
          <span
            className="block max-w-[220px] truncate text-muted-foreground"
            title={row.original.notes ?? undefined}
          >
            {row.original.notes ?? "—"}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      data={donations}
      searchPlaceholder="Search donors..."
      pageSize={10}
      emptyState={
        <EmptyState
          icon={<Coins aria-hidden />}
          title="No donations yet"
          description="PayPal webhook donations and manual entries will appear here."
        />
      }
    />
  )
}

/* ------------------------------------------------------------------ */

export function RecordDonationDialog() {
  const [open, setOpen] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  const [state, formAction, pending] = useActionState<ManualDonationFormState, FormData>(
    async (prevState, formData) => {
      const result = await recordManualDonation(prevState, formData)
      if (result?.success) {
        toast.success(result.message ?? "Manual donation recorded.")
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
          Record donation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record manual donation</DialogTitle>
          <DialogDescription>
            For checks, cash, or other offline gifts. Board and corporate officers only.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
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
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Recording..." : "Record donation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
