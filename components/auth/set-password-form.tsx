"use client"

import { useActionState } from "react"
import { setPassword } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SetPasswordForm({ errorMessage }: { errorMessage?: string }) {
  const [state, action, pending] = useActionState(setPassword, undefined)

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <FormFieldError errors={state?.errors?.password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
        <FormFieldError errors={state?.errors?.confirmPassword} />
      </div>

      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}
      {state?.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving..." : "Set password & continue"}
      </Button>
    </form>
  )
}
