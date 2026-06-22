import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { LoginHashRecovery } from "@/components/auth/login-hash-recovery"
import { LoginForm } from "@/components/auth/login-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { siteConfig } from "@/lib/config/site"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Log In",
  description: "Sign in to The Resonance Foundation member portal.",
}

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-serif text-2xl">Member Portal</CardTitle>
        <CardDescription>
          Sign in to view your dashboard, applications, and chapter tools.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense fallback={null}>
          <LoginHashRecovery />
          <LoginForm />
        </Suspense>
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <Button asChild variant="outline">
            <Link href={routes.enroll}>Enroll</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={routes.join}>Join as Tutor / Officer / Volunteer</Link>
          </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Need help?{" "}
          <a href={siteConfig.links.email.mailto} className="text-primary hover:underline">
            Contact us
          </a>
        </p>
      </CardContent>
    </Card>
  )
}
