"use client"

import { useActionState } from "react"
import { resendSignupConfirmation } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import type { SignupFormState } from "@/lib/validations/auth"

export function ResendConfirmationForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendSignupConfirmation, undefined)

  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="email" value={email} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Sending..." : "Resend confirmation email"}
      </Button>
      {state?.message ? (
        <p
          className={`text-xs ${state.success ? "text-primary" : "text-destructive"}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  )
}

export function SignupSuccessPanel({
  message,
  email,
}: {
  message: string
  email?: string
}) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
      <p className="font-medium text-foreground">{message}</p>
      <p className="mt-2 text-muted-foreground">
        Didn&apos;t get it? Check spam, then resend below. You must confirm your email
        before you can log in and add students.
      </p>
      {email ? <ResendConfirmationForm email={email} /> : null}
    </div>
  )
}

export type { SignupFormState }
