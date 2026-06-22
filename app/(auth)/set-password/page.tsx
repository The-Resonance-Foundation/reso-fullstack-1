import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { SetPasswordForm } from "@/components/auth/set-password-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth/dal"

export const metadata: Metadata = {
  title: "Set Your Password",
  description: "Complete your Resonance Foundation account setup.",
}

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const user = await getSession()
  if (!user) {
    redirect("/login?error=invite_session_required")
  }

  const params = await searchParams

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-serif text-2xl">Set your password</CardTitle>
        <CardDescription>
          Welcome! Create a password for your member portal account, then you can sign
          in anytime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SetPasswordForm errorMessage={params.error} />
      </CardContent>
    </Card>
  )
}
