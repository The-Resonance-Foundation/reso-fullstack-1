import type { Metadata } from "next"
import Image from "next/image"
import { Heart, Lightbulb, Music, Target, Users } from "lucide-react"
import { CTABand } from "@/components/layout/cta-band"
import { PageHero } from "@/components/layout/page-hero"
import { Section, SectionHeader } from "@/components/layout/section"
import { PhotoGrid } from "@/components/marketing/photo-grid"
import { StatsBar } from "@/components/marketing/stats-bar"
import { Card, CardContent } from "@/components/ui/card"
import { aboutGallery, aboutValues, siteMetadata, stats, whatWeDo } from "@/content"
import { routes } from "@/lib/routes"
import { imagePath } from "@/lib/utils"

export const metadata: Metadata = {
  title: "About",
  description: siteMetadata.taglineExtended,
}

const valueIcons = {
  accessible: Target,
  community: Heart,
  "student-led": Lightbulb,
  quality: Music,
} as const

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About The Resonance Foundation"
        subtitle={siteMetadata.taglineExtended}
      />

      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader
              title="Our Mission"
              description="The Resonance Foundation is a nonprofit organization dedicated to offering low-cost music education to students, fostering a love for music while helping them improve their skills."
            />
            <p className="mb-8 text-lg text-muted-foreground">
              We believe that every child deserves access to quality music education, regardless of
              their financial situation. Through our dedicated team of student tutors and community
              partnerships, we are making music education accessible to all.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {aboutValues.map((value) => {
                const Icon = valueIcons[value.key]
                return (
                  <div key={value.title} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" aria-hidden />
                    </div>
                    <span className="text-sm font-medium">{value.title}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={imagePath("DSC09907-tutor-student.webp")}
              alt="Tutor working with a young student"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </Section>

      <StatsBar stats={stats.impactStats} />

      <Section variant="muted">
        <SectionHeader title="What We Do" align="center" className="mx-auto" />
        <div className="grid gap-6 md:grid-cols-3">
          {whatWeDo.map((item, i) => (
            <Card key={item.title} className="text-center">
              <CardContent className="pt-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  {i === 0 && <Music className="h-7 w-7 text-primary" />}
                  {i === 1 && <Users className="h-7 w-7 text-primary" />}
                  {i === 2 && <Heart className="h-7 w-7 text-primary" />}
                </div>
                <h3 className="font-serif text-xl font-bold">{item.title}</h3>
                <p className="mt-3 text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader title="Our Community in Action" align="center" className="mx-auto" />
        <PhotoGrid photos={aboutGallery} columns={3} />
      </Section>

      <CTABand
        title="Join Our Mission"
        description="Whether you want to learn, teach, or support music education, there is a place for you at The Resonance Foundation."
        variant="default"
        buttons={[
          { label: "Get Involved", href: routes.getInvolved },
          { label: "Support Us", href: routes.donate, variant: "outline" },
        ]}
      />
    </>
  )
}
