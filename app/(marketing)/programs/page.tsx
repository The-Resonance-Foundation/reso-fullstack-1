import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { CTABand } from "@/components/layout/cta-band"
import { PageHero } from "@/components/layout/page-hero"
import { Section } from "@/components/layout/section"
import { PhotoGrid } from "@/components/marketing/photo-grid"
import { Button } from "@/components/ui/button"
import { homePerformanceGallery, programs } from "@/content"
import { siteConfig } from "@/lib/config/site"
import { routes } from "@/lib/routes"
import { imagePath } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Programs",
  description: programs.pageSubtitle,
}

export default function ProgramsPage() {
  return (
    <>
      <PageHero title={programs.pageTitle} subtitle={programs.pageSubtitle} />

      <Section>
        <div className="space-y-20">
          {programs.programs.map((program, index) => (
            <div
              key={program.id}
              className={`grid items-center gap-10 lg:grid-cols-2 ${
                index % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div>
                <h2 className="font-serif text-3xl font-bold">{program.name}</h2>
                <p className="mt-4 text-lg text-muted-foreground">{program.description}</p>
                <div className="mt-6">
                  <h3 className="font-semibold">Instruments Offered</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {program.instruments.map((instrument) => (
                      <span
                        key={instrument}
                        className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                      >
                        {instrument}
                      </span>
                    ))}
                    <span className="rounded-full bg-accent/15 px-3 py-1 text-sm italic text-accent-foreground">
                      {programs.instrumentsNote}
                    </span>
                  </div>
                </div>
                <Button asChild className="mt-6">
                  <Link href={routes.enroll}>Sign Up for {program.name} Lessons</Link>
                </Button>
              </div>
              <div className="relative aspect-[3/2] overflow-hidden rounded-2xl shadow-lg">
                <Image
                  src={imagePath(program.image)}
                  alt={`${program.name} program`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section variant="primary">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-bold md:text-4xl">
              {programs.performanceOpportunities.title}
            </h2>
            {programs.performanceOpportunities.paragraphs.map((p) => (
              <p key={p.slice(0, 30)} className="mt-4 text-lg opacity-90">
                {p}
              </p>
            ))}
            <Button asChild variant="secondary" size="lg" className="mt-6">
              <a href={siteConfig.links.email.mailto}>Inquire About Performing</a>
            </Button>
          </div>
          <PhotoGrid photos={homePerformanceGallery} columns={2} />
        </div>
      </Section>

      <CTABand
        title="Ready to Start Learning?"
        description="Join hundreds of students who have discovered their love of music through The Resonance Foundation."
        variant="default"
        buttons={[
          { label: "Sign Up as a Student", href: routes.enroll },
          { label: "View FAQ", href: routes.faq, variant: "outline" },
        ]}
      />
    </>
  )
}
