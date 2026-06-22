import type { Metadata } from "next"
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
    <SignupPageSection>
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
  )
}
