import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { CTABand } from "@/components/layout/cta-band"
import { PageHero } from "@/components/layout/page-hero"
import { Section, SectionHeader } from "@/components/layout/section"
import { PhotoGrid } from "@/components/marketing/photo-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getInvolvedOpportunities, teamGallery } from "@/content"
import { routes } from "@/lib/routes"
import { imagePath } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Get Involved",
  description:
    "There are many ways to join our mission of making music education accessible to all.",
}

export default function GetInvolvedPage() {
  return (
    <>
      <PageHero
        title="Get Involved"
        subtitle="There are many ways to join our mission of making music education accessible to all."
      />

      <Section>
        <div className="grid gap-8 md:grid-cols-2">
          {getInvolvedOpportunities.map((opp) => (
            <Card key={opp.id} className="overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={imagePath(opp.image)}
                  alt={opp.imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              </div>
              <CardHeader>
                <CardTitle>{opp.title}</CardTitle>
                <CardDescription className="text-base">{opp.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="mb-6 space-y-2 text-muted-foreground">
                  {opp.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="text-primary">—</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
                {opp.disabled ? (
                  <div className="rounded-md border border-dashed border-border bg-muted/50 px-4 py-3 text-center text-sm text-muted-foreground">
                    {opp.cta}. Email us if you would like to be notified when applications reopen.
                  </div>
                ) : (
                  <Button asChild className="w-full">
                    <Link
                      href={opp.href}
                      target={"external" in opp && opp.external ? "_blank" : undefined}
                      rel={"external" in opp && opp.external ? "noopener noreferrer" : undefined}
                    >
                      {opp.cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section variant="muted">
        <SectionHeader title="Our Team in Action" align="center" className="mx-auto" />
        <PhotoGrid photos={teamGallery} columns={4} />
      </Section>

      <CTABand
        title="Support Our Mission"
        description="Your donation helps us provide affordable music education to students who might otherwise not have access. Every contribution makes a difference."
        buttons={[{ label: "Donate Now", href: routes.donate }]}
      />
    </>
  )
}
