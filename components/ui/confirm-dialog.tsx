"use client"

import { useState, useTransition } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type ConfirmDialogProps = {
  /** The element that opens the dialog (rendered via asChild). */
  trigger: React.ReactNode
  title: string
  description: string
  confirmLabel?: string
  /** Destructive styling for the confirm button (default true). */
  destructive?: boolean
  /** Runs when confirmed; the dialog closes when the promise resolves. */
  onConfirm: () => Promise<void> | void
}

/**
 * Replaces window.confirm() with a styled, accessible confirmation.
 * Keeps the dialog open with a spinner while onConfirm runs.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = true,
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant={destructive ? "default" : "secondary"}
            className={
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await onConfirm()
                setOpen(false)
              })
            }}
          >
            {pending ? <Spinner size="sm" /> : null}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
