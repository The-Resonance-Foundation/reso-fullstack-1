import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { CTABand } from "@/components/layout/cta-band"
import { Section, SectionHeader } from "@/components/layout/section"
import { PhotoGrid } from "@/components/marketing/photo-grid"
import { ProgramCard } from "@/components/marketing/program-card"
import { StatsBar } from "@/components/marketing/stats-bar"
import { Button } from "@/components/ui/button"
import { homePerformanceGallery, programs, siteMetadata, stats } from "@/content"
import { routes } from "@/lib/routes"
import { imagePath } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Home",
  description: siteMetadata.description,
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    images: [{ url: "/images/DSC00055-student-flute.webp" }],
  },
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[85vh] pt-16 md:pt-20">
        <Image
          src={imagePath("DSC00055-student-flute.webp")}
          alt="Student learning flute with tutor guidance"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/30" />
        <div className="container relative mx-auto flex min-h-[85vh] items-center px-4 py-20">
          <div className="max-w-2xl text-white">
            <p className="mb-4 inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              {siteMetadata.heroBadge}
            </p>
            <h1 className="font-serif text-4xl font-bold leading-tight md:text-6xl">
              {siteMetadata.organizationName}
            </h1>
            <p className="mt-3 font-serif text-xl italic text-white/90 md:text-2xl">
              {siteMetadata.tagline}
            </p>
            <p className="mt-5 text-lg leading-relaxed text-white/85">
              {siteMetadata.heroDescription}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link href={routes.enroll}>Enroll Today</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href={routes.about}>Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <StatsBar stats={stats.homeStats} />

      {/* Mission */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader
              eyebrow="Our Mission"
              title="Empowering Young Musicians Through Accessible Education"
              description="The Resonance Foundation is a nonprofit organization dedicated to offering low-cost music education to students, fostering a love for music while helping them improve their skills. We believe every child deserves the opportunity to explore their musical potential."
            />
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href={routes.about}>
                  Learn More <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={routes.programs}>View Programs</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
              <Image
                src={imagePath("DSC00055-student-flute.webp")}
                alt="Student learning flute"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-xl border border-border bg-card px-5 py-3 shadow-lg">
              <div className="font-serif text-2xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Student-Led Initiative</div>
            </div>
          </div>
        </div>
      </Section>

      {/* Programs preview */}
      <Section variant="muted">
        <SectionHeader
          eyebrow="What We Offer"
          title="Our Music Programs"
          description="We offer comprehensive instruction across four major instrument families, plus performance opportunities."
          align="center"
          className="mx-auto"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {programs.programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              href={routes.programs}
            />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild size="lg">
            <Link href={routes.programs}>
              Explore All Programs <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* Community impact */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <PhotoGrid photos={homePerformanceGallery} columns={2} />
          <div>
            <SectionHeader
              eyebrow="Community Impact"
              title="Live Performances & Community Events"
              description="Our students regularly perform at community events, malls, senior centers, and special occasions. These performances provide valuable experience and help raise awareness for music education."
            />
            <Button asChild size="lg" variant="outline">
              <Link href={routes.getInvolved}>
                Get Involved <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      <CTABand
        title="Ready to Start Your Musical Journey?"
        description="Whether you want to learn an instrument, become a tutor, or support our mission, there is a place for you at The Resonance Foundation."
        buttons={[
          { label: "Enroll", href: routes.enroll },
          { label: "Support Our Mission", href: routes.donate, variant: "outline" },
        ]}
      />
    </>
  )
}
