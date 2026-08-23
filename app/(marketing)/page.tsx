import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { CTABand } from "@/components/layout/cta-band"
import { Section } from "@/components/layout/section"
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
  const [g1, g2, g3] = homePerformanceGallery
  return (
    <>
      {/* Hero — text over the resonance field; tapping open space plays a note */}
      <section
        id="noc-hero"
        className="relative flex min-h-screen cursor-crosshair flex-col items-center justify-center px-6 pb-[150px] pt-[120px] text-center"
      >
        <div className="mb-6 flex items-center gap-4">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary sm:w-12" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--noc-accent-300)] sm:text-[13px]">
            {siteMetadata.heroBadge}
          </span>
          <span className="h-px w-8 bg-gradient-to-r from-primary to-transparent sm:w-12" />
        </div>
        <div style={{ perspective: "1100px" }}>
          <h1
            id="heroT"
            className="text-[clamp(48px,7.4vw,110px)] leading-[1.02] tracking-[-0.025em] will-change-transform"
          >
            The Resonance
            <br />
            Foundation
          </h1>
        </div>
        <p className="mb-3 mt-7 text-[clamp(18px,1.6vw,23px)] tracking-[0.06em] text-[var(--noc-accent-200)]">
          {siteMetadata.tagline}
        </p>
        <p className="mb-10 max-w-[600px] text-[17px] leading-[1.7] text-[var(--noc-neutral-300)]">
          {siteMetadata.heroDescription}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="px-8 text-[15px]">
            <Link href={routes.enroll}>Enroll Today</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="px-8 text-[15px]">
            <Link href={routes.about}>Learn More</Link>
          </Button>
        </div>
        {/* Tap hint */}
        <div className="absolute bottom-9 left-9 hidden items-center gap-2.5 text-[11.5px] uppercase tracking-[0.16em] text-[var(--noc-accent-600)] md:flex">
          <span aria-hidden>♪</span>
          <span>Tap anywhere &mdash; every ripple is a note</span>
        </div>
        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2.5 md:flex">
          <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--noc-neutral-400)]">
            Scroll
          </span>
          <span className="relative block h-11 w-px overflow-hidden bg-[var(--noc-neutral-800)]">
            <span className="absolute left-0 top-0 h-full w-px animate-[noc-cue-drop_1.8s_cubic-bezier(0.6,0,0.4,1)_infinite] bg-primary" />
          </span>
        </div>
      </section>

      <StatsBar stats={stats.homeStats} />

      {/* Mission */}
      <Section className="md:py-[130px]">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div data-reveal="1">
            <p className="noc-eyebrow">Our Mission</p>
            <h2 className="mb-6 mt-5 text-3xl leading-[1.12] tracking-[-0.015em] [text-wrap:pretty] md:text-[clamp(34px,3.3vw,48px)]">
              Empowering Young Musicians Through Accessible Education
            </h2>
            <p className="mb-9 max-w-[540px] text-[16.5px] leading-[1.75] text-[var(--noc-neutral-300)]">
              The Resonance Foundation is a nonprofit organization dedicated to
              offering completely free music education to students, fostering a
              love for music while helping them improve their skills. We believe
              every child deserves the opportunity to explore their musical
              potential.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href={routes.about}>
                  Learn More <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href={routes.programs}>
                  View Programs <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div data-reveal="1" className="relative">
            <div className="noc-card relative aspect-[4/4.2] overflow-hidden">
              <Image
                src={imagePath("DSC00055-student-flute.webp")}
                alt="Student learning flute with tutor guidance"
                fill
                data-plx="0.09"
                className="scale-[1.14] object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute -left-2 bottom-8 animate-[noc-float-y_5.5s_ease-in-out_infinite] rounded-lg bg-card px-6 py-4 shadow-[var(--noc-shadow-md)] lg:-left-7">
              <div className="text-3xl font-medium text-[var(--noc-accent-200)]">100%</div>
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--noc-neutral-300)]">
                Student-Led Initiative
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Scroll-linked marquee */}
      <div className="overflow-hidden whitespace-nowrap border-y border-border py-6">
        <div
          id="noc-marquee"
          className="inline-block text-[40px] font-medium tracking-[0.02em] text-foreground/25 will-change-transform md:text-[56px]"
          aria-hidden
        >
          {Array.from({ length: 6 })
            .map(() => "Empowering Minds  —  Inspiring Change  —  ")
            .join("")}
        </div>
      </div>

      {/* Programs preview */}
      <Section className="md:py-[130px]">
        <div
          data-reveal="1"
          className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10"
        >
          <div>
            <p className="noc-eyebrow">What We Offer</p>
            <h2 className="mt-5 text-3xl leading-[1.12] tracking-[-0.015em] md:text-[clamp(34px,3.3vw,48px)]">
              Our Music Programs
            </h2>
          </div>
          <p className="max-w-[380px] text-[15.5px] leading-[1.65] text-[var(--noc-neutral-300)]">
            We offer comprehensive instruction across four major instrument
            families, plus performance opportunities — and every lesson is free.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {programs.programs.map((program, i) => (
            <ProgramCard
              key={program.id}
              program={program}
              href={routes.programs}
              index={i}
            />
          ))}
        </div>
        <div data-reveal="1" className="mt-11">
          <Button asChild size="lg">
            <Link href={routes.programs}>
              Explore All Programs <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* Community impact */}
      <Section className="md:pb-[150px]">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div data-reveal="1" className="grid grid-cols-2 gap-4">
            {g1 && (
              <div className="noc-card col-span-2 h-[250px] overflow-hidden">
                <Image
                  src={imagePath(g1.file)}
                  alt={g1.alt}
                  width={1200}
                  height={500}
                  data-plx="0.07"
                  className="h-full w-full scale-[1.14] object-cover"
                />
              </div>
            )}
            {g2 && (
              <div className="noc-card h-[210px] overflow-hidden">
                <Image
                  src={imagePath(g2.file)}
                  alt={g2.alt}
                  width={600}
                  height={420}
                  data-plx="0.12"
                  className="h-full w-full scale-[1.16] object-cover"
                />
              </div>
            )}
            {g3 && (
              <div className="noc-card mt-6 h-[210px] overflow-hidden">
                <Image
                  src={imagePath(g3.file)}
                  alt={g3.alt}
                  width={600}
                  height={420}
                  data-plx="0.05"
                  className="h-full w-full scale-[1.14] object-cover"
                />
              </div>
            )}
          </div>
          <div data-reveal="1">
            <p className="noc-eyebrow">Community Impact</p>
            <h2 className="mb-6 mt-5 text-3xl leading-[1.12] tracking-[-0.015em] [text-wrap:pretty] md:text-[clamp(34px,3.3vw,48px)]">
              Live Performances &amp; Community Events
            </h2>
            <p className="mb-9 text-[16.5px] leading-[1.75] text-[var(--noc-neutral-300)]">
              Our students regularly perform at community events, malls, senior
              centers, and special occasions. These performances provide valuable
              experience and help raise awareness for music education.
            </p>
            <Button asChild size="lg">
              <Link href={routes.getInvolved}>
                Get Involved <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      <CTABand
        title="Ready to Start Your Musical Journey?"
        description="Whether you want to learn an instrument, become a tutor, or support our mission, there is a place for you at The Resonance Foundation. Every lesson is completely free."
        buttons={[
          { label: "Enroll", href: routes.enroll },
          { label: "Support Our Mission", href: routes.donate, variant: "outline" },
        ]}
      />
    </>
  )
}
