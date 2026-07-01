import type { Metadata } from "next"
import { PageHero } from "@/components/layout/page-hero"
import { SignupForm } from "@/components/auth/signup-form"
import { SignupPageSection } from "@/components/layout/signup-page-section"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveChapters } from "@/lib/data/chapters"

export const metadata: Metadata = {
  title: "Parent Enrollment",
  description: "Create a parent account with The Resonance Foundation.",
}

export default async function EnrollParentPage() {
  const chapters = await getActiveChapters()

  return (
    <>
      <PageHero
        title="Create a Parent Account"
        subtitle="One household login for all linked students. Add each student in the portal after confirming your email."
        compact
      />
      <SignupPageSection className="!pt-8">
      <Card className="w-full overflow-visible">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Create a Parent Account</CardTitle>
          <CardDescription>
            Parents manage one household login for all linked students. After confirming
            your email, add each student in the portal for chapter review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm variant="parent" chapters={chapters} />
        </CardContent>
      </Card>
    </SignupPageSection>
    </>
  )
}
