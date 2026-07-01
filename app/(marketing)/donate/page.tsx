import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, GraduationCap, Music, Users } from "lucide-react"
import { PageHero } from "@/components/layout/page-hero"
import { Section, SectionHeader } from "@/components/layout/section"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription } from "@/components/ui/card"
import { pricing, stats } from "@/content"
import { siteConfig } from "@/lib/config/site"
import { routes } from "@/lib/routes"
import { imagePath } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Donate",
  description: "Your generosity helps us provide affordable music education to students who need it most.",
}

const impactItems = [
  {
    icon: GraduationCap,
    title: "Scholarships",
    description: "Financial aid for students who cannot afford lessons",
  },
  {
    icon: Music,
    title: "Instruments & Equipment",
    description: "Providing instruments for students who do not have access",
  },
  {
    icon: Users,
    title: "Community Programs",
    description: "Performances and events that bring music to the community",
  },
]

export default function DonatePage() {
  return (
    <>
      <PageHero
        title="Support Music Education"
        subtitle="Your generosity helps us provide affordable music education to students who need it most."
      />

      <Section>
        <div className="mx-auto grid max-w-5xl items-start gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader
              title="Make a Difference Today"
              description="Every donation, no matter the size, helps us continue our mission of making music education accessible to all. Your contribution directly supports:"
            />
            <ul className="space-y-5">
              {impactItems.map((item) => (
                <li key={item.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Card className="mt-8 bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <div className="mb-4 text-2xl font-bold">{stats.donationRaised.value} Raised</div>
                <p className="mb-4 opacity-80">{stats.donationRaised.label}</p>
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  <a
                    href={siteConfig.donation.paypal}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Donate via PayPal <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl shadow-xl">
              <Image
                src={imagePath("DSC09848-flute-lesson.webp")}
                alt="Tutor teaching flute to young student"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative h-40 overflow-hidden rounded-xl">
                <Image
                  src={imagePath("DSC09965-girl-tuba.webp")}
                  alt="Young girl trying tuba"
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </div>
              <div className="relative h-40 overflow-hidden rounded-xl">
                <Image
                  src={imagePath("DSC09888-saxophone.webp")}
                  alt="Saxophone lesson"
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section variant="muted">
        <SectionHeader title="Your Impact" align="center" className="mx-auto" />
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
          {pricing.donationImpact.map((tier) => (
            <Card key={tier.amount} className="text-center">
              <CardContent className="pt-8">
                <div className="text-4xl font-bold text-primary">${tier.amount}</div>
                <CardDescription className="mt-2 text-base">{tier.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-2xl text-center">
          <SectionHeader
            title="Other Ways to Support"
            description="Cannot donate? There are still many ways you can help support music education in our community."
            align="center"
            className="mx-auto"
          />
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="outline" size="lg">
              <Link href={routes.join}>Join as Staff</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={siteConfig.links.email.mailto}>Partner With Us</a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a
                href={siteConfig.links.social.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Spread the Word
              </a>
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}
