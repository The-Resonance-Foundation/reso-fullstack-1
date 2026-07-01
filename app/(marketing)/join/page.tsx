import type { Metadata } from "next"
import { PageHero } from "@/components/layout/page-hero"
import { SignupForm } from "@/components/auth/signup-form"
import { SignupPageSection } from "@/components/layout/signup-page-section"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Join as Staff",
  description:
    "Register as a tutor, chapter officer, or volunteer with The Resonance Foundation.",
}

export default function JoinPage() {
  return (
    <>
      <PageHero
        title="Join Our Team"
        subtitle="Register as a tutor, chapter officer, or volunteer and help make music education accessible."
        compact
      />
      <SignupPageSection className="!pt-8">
      <Card className="w-full overflow-visible">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            Tutor / Officer / Volunteer Registration
          </CardTitle>
          <CardDescription>
            Create an account, then log in to submit your application from the dashboard.
            Chapter officers review applications before roles are granted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm variant="staff" />
        </CardContent>
      </Card>
    </SignupPageSection>
    </>
  )
}
