"use client"

import { useActionState, useState } from "react"
import { MailPlus, Pencil } from "lucide-react"
import { toast } from "sonner"
import {
  clearNotificationEmail,
  updateNotificationEmail,
  type AccountActionState,
} from "@/app/actions/account"
import { Button } from "@/components/ui/button"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function EmailForm({
  currentEmail,
  onDone,
}: {
  currentEmail: string | null
  onDone?: () => void
}) {
  const [state, action, pending] = useActionState(
    async (prev: AccountActionState, formData: FormData) => {
      const result = await updateNotificationEmail(prev, formData)
      if (result?.success) {
        toast.success(result.message ?? "Saved.")
        onDone?.()
      }
      return result
    },
    undefined
  )

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="min-w-[240px] flex-1 space-y-1.5">
        <Label htmlFor="notificationEmail" className="text-xs">
          Personal email
        </Label>
        <Input
          id="notificationEmail"
          name="notificationEmail"
          type="email"
          required
          defaultValue={currentEmail ?? ""}
          placeholder="you@gmail.com"
          autoComplete="email"
        />
        <FormFieldError errors={state?.errors?.notificationEmail} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </Button>
      {onDone ? (
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
      ) : null}
      {state?.message && !state.success ? (
        <p className="w-full text-sm text-destructive">{state.message}</p>
      ) : null}
    </form>
  )
}

export function NotificationEmailBanner({
  notificationEmail,
  accountEmail,
}: {
  notificationEmail: string | null
  accountEmail: string
}) {
  const [editing, setEditing] = useState(false)

  // Set and not being changed: a quiet one-line reminder, no banner.
  if (notificationEmail && !editing) {
    return (
      <p className="animate-fade-up flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <MailPlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Emails also go to <strong className="font-medium">{notificationEmail}</strong>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 text-[var(--acc-hi,#F8B269)] underline-offset-2 hover:underline"
        >
          <Pencil className="h-3 w-3" aria-hidden />
          Change
        </button>
        <button
          type="button"
          onClick={async () => {
            const result = await clearNotificationEmail()
            if (result?.success) toast.success(result.message ?? "Removed.")
            else if (result?.message) toast.error(result.message)
          }}
          className="text-muted-foreground underline-offset-2 hover:underline"
        >
          Remove
        </button>
      </p>
    )
  }

  return (
    <section className="animate-fade-up rounded-2xl border border-[var(--acc-hi,#F8B269)]/30 bg-[rgba(240,140,46,.07)] p-4 md:p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(240,140,46,.16)]">
          <MailPlus className="h-4.5 w-4.5 text-[var(--acc-hi,#F8B269)]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="font-serif text-base font-bold">
              {editing ? "Update your notification email" : "Add a personal email"}
            </h2>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
              Portal emails go to <strong className="font-medium">{accountEmail}</strong>.
              Add a personal address and every notification will be sent to both, so
              nothing gets missed.
            </p>
          </div>
          <EmailForm
            currentEmail={notificationEmail}
            onDone={editing ? () => setEditing(false) : undefined}
          />
        </div>
      </div>
    </section>
  )
}
