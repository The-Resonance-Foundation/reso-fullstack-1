"use client"

import { useActionState } from "react"
import Link from "next/link"
import { requestPasswordReset } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { routes } from "@/lib/routes"

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined)

  if (state?.success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
          <p className="font-medium text-foreground">{state.message}</p>
          <p className="mt-2 text-muted-foreground">
            Check your spam folder if you don&apos;t see it within a few minutes.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href={routes.auth.login}>Back to log in</Link>
        </Button>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FormFieldError errors={state?.errors?.email} />
      </div>

      {state?.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending..." : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href={routes.auth.login} className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  )
}
