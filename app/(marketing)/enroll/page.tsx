import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHero } from "@/components/layout/page-hero"
import { Section, SectionHeader } from "@/components/layout/section"
import { Card, CardContent } from "@/components/ui/card"
import { pricing } from "@/content"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Enroll",
  description: "Sign up for affordable music lessons with The Resonance Foundation.",
}

const steps = [
  "Create a parent account for your household",
  "Confirm your email address",
  "Add each student in the parent portal",
  "Your chapter reviews and approves each student",
]

export default function EnrollPage() {
  return (
    <>
      <PageHero
        title="Enroll"
        subtitle="Start your musical journey with affordable lessons from dedicated student tutors."
      />

      <Section>
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader
              title="Who Can Enroll?"
              description="Students of all ages and skill levels are welcome. Whether you are a complete beginner or looking to improve, we have a place for you."
            />
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                Woodwind, brass, string, and vocal instruction
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                Group and individual lessons available
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                Financial aid available for qualifying families
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                Sessions held at community libraries and partner locations
              </li>
            </ul>

            <div className="mt-8 rounded-xl border border-border bg-muted/50 p-6">
              <h3 className="font-serif text-lg font-bold">Lesson Pricing</h3>
              <p className="mt-2 text-muted-foreground">{pricing.lessons.group.description}</p>
              <p className="mt-1 text-muted-foreground">{pricing.lessons.individual.description}</p>
              <p className="mt-3 text-sm text-muted-foreground">{pricing.lessons.financialAid}</p>
            </div>
          </div>

          <div>
            <Card>
              <CardContent className="pt-8">
                <h3 className="font-serif text-xl font-bold">How enrollment works</h3>
                <ol className="mt-4 space-y-4">
                  {steps.map((step, i) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-8">
                  <Button asChild className="w-full" size="lg">
                    <Link href={routes.enrollParent}>Create Parent Account</Link>
                  </Button>
                </div>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href={routes.auth.login} className="text-primary hover:underline">
                    Log in
                  </Link>{" "}
                  to add students in the portal.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>
    </>
  )
}
