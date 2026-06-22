import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Mail } from "lucide-react"
import { FacebookIcon, InstagramIcon } from "@/components/icons/social"
import { PageHero } from "@/components/layout/page-hero"
import { Section, SectionHeader } from "@/components/layout/section"
import { PhotoGrid } from "@/components/marketing/photo-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { contactGallery } from "@/content"
import { siteConfig } from "@/lib/config/site"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Contact",
  description: "We would love to hear from you. Get in touch with The Resonance Foundation.",
}

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    description: "For general inquiries, partnerships, or questions",
    href: siteConfig.links.email.mailto,
    label: siteConfig.links.email.address,
  },
  {
    icon: InstagramIcon,
    title: "Instagram",
    description: "Follow us for updates, photos, and events",
    href: siteConfig.links.social.instagram.url,
    label: siteConfig.links.social.instagram.handle,
    external: true,
  },
  {
    icon: FacebookIcon,
    title: "Facebook",
    description: "Connect with our community on Facebook",
    href: siteConfig.links.social.facebook.url,
    label: siteConfig.links.social.facebook.name,
    external: true,
  },
]

const quickActions = [
  {
    title: "Enroll",
    description: "Ready to start your musical journey?",
    href: routes.enroll,
    variant: "default" as const,
  },
  {
    title: "Join as Staff",
    description: "Tutor, officer, or volunteer registration",
    href: routes.join,
    variant: "default" as const,
  },
  {
    title: "Support Our Mission",
    description: "Help us make music education accessible",
    href: routes.donate,
    variant: "outline" as const,
  },
]

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contact Us"
        subtitle="We would love to hear from you. Get in touch with The Resonance Foundation."
      />

      <Section>
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader title="Get in Touch" />
            <div className="space-y-4">
              {contactMethods.map((method) => (
                <Card key={method.title}>
                  <CardContent className="flex gap-4 pt-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <method.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{method.title}</h3>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                      <a
                        href={method.href}
                        target={method.external ? "_blank" : undefined}
                        rel={method.external ? "noopener noreferrer" : undefined}
                        className="mt-1 inline-block font-medium text-primary hover:underline"
                      >
                        {method.label}
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader title="Quick Actions" />
            <div className="space-y-4">
              {quickActions.map((action) => (
                <Card key={action.title} className={action.variant === "default" ? "bg-primary text-primary-foreground" : ""}>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold">{action.title}</h3>
                    <p className={`mt-1 text-sm ${action.variant === "default" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {action.description}
                    </p>
                    <Button asChild variant={action.variant === "default" ? "secondary" : "outline"} className="mt-4 w-full">
                      <Link href={action.href}>
                        Go <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section variant="muted">
        <SectionHeader title="Join Our Musical Community" align="center" className="mx-auto" />
        <PhotoGrid photos={contactGallery} columns={3} />
      </Section>

      <Section>
        <div className="mx-auto max-w-2xl text-center">
          <SectionHeader
            title="Have Questions?"
            description="Check out our FAQ page for answers to common questions about lessons, tutoring, donations, and more."
            align="center"
            className="mx-auto"
          />
          <Button asChild variant="outline" size="lg">
            <Link href={routes.faq}>
              View FAQ <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>
    </>
  )
}
