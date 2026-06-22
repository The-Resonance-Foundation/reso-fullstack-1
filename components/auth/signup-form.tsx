"use client"

import { useActionState } from "react"
import Link from "next/link"
import { signupParent, signupStaff } from "@/app/actions/auth"
import {
  ResendConfirmationForm,
  SignupSuccessPanel,
} from "@/components/auth/resend-confirmation-form"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/forms/native-select"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Chapter } from "@/types/database"
import type { SignupType } from "@/lib/validations/auth"
import { routes } from "@/lib/routes"

type SignupFormProps = {
  variant: SignupType
  chapters?: Chapter[]
}

export function SignupForm({ variant, chapters = [] }: SignupFormProps) {
  const action = variant === "parent" ? signupParent : signupStaff
  const [state, formAction, pending] = useActionState(action, undefined)

  if (state?.success && state.message) {
    return <SignupSuccessPanel message={state.message} email={state.email} />
  }

  if (state?.needsConfirmation && state.email) {
    return (
      <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <p className="text-destructive">{state.message}</p>
        <ResendConfirmationForm email={state.email} />
      </div>
    )
  }

  const isParent = variant === "parent"

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" autoComplete="name" required />
        <FormFieldError errors={state?.errors?.fullName} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FormFieldError errors={state?.errors?.email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" />
        <FormFieldError errors={state?.errors?.phone} />
      </div>

      {isParent ? (
        <div className="space-y-2">
          <Label htmlFor="chapterId">Chapter</Label>
          {chapters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No chapters available yet. Please contact us to enroll.
            </p>
          ) : (
            <>
              <NativeSelect id="chapterId" name="chapterId" required defaultValue="">
                <option value="" disabled>
                  Select your chapter
                </option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name}
                    {chapter.city ? ` — ${chapter.city}, ${chapter.state}` : ""}
                  </option>
                ))}
              </NativeSelect>
              <FormFieldError errors={state?.errors?.chapterId} />
            </>
          )}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <FormFieldError errors={state?.errors?.password} />
      </div>

      {isParent ? (
        <p className="text-xs text-muted-foreground">
          One parent login can manage multiple students in your household. After
          confirming your email, add each student from the portal for chapter review.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          After confirming your email, log in to submit tutor, officer, or volunteer
          applications from your dashboard.
        </p>
      )}

      {state?.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        disabled={pending || (isParent && chapters.length === 0)}
      >
        {pending
          ? "Creating account..."
          : isParent
            ? "Create Parent Account"
            : "Create Account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={routes.auth.login} className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  )
}
