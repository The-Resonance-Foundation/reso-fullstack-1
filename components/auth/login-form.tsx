"use client"

import { useActionState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { login } from "@/app/actions/auth"
import { ResendConfirmationForm } from "@/components/auth/resend-confirmation-form"
import { Button } from "@/components/ui/button"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { routes } from "@/lib/routes"

export function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? ""
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FormFieldError errors={state?.errors?.email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <FormFieldError errors={state?.errors?.password} />
      </div>

      {state?.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}

      {state?.needsConfirmation && state.email ? (
        <ResendConfirmationForm email={state.email} />
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Log In"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New parent?{" "}
        <Link href={routes.enrollParent} className="text-primary hover:underline">
          Enroll as a parent
        </Link>
      </p>
    </form>
  )
}
