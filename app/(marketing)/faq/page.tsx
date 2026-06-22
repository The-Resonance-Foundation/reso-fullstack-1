import type { Metadata } from "next"
import { CTABand } from "@/components/layout/cta-band"
import { PageHero } from "@/components/layout/page-hero"
import { Section } from "@/components/layout/section"
import { FaqList } from "@/components/marketing/faq-list"
import { faq } from "@/content"
import { siteConfig } from "@/lib/config/site"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "FAQ",
  description: faq.pageSubtitle,
}

export default function FaqPage() {
  return (
    <>
      <PageHero title={faq.pageTitle} subtitle={faq.pageSubtitle} />

      <Section>
        <div className="mx-auto max-w-3xl">
          <FaqList />
        </div>
      </Section>

      <CTABand
        title={faq.cta.title}
        description={faq.cta.body}
        variant="default"
        buttons={[
          { label: "Contact Us", href: siteConfig.links.email.mailto, external: true },
          { label: "Visit Contact Page", href: routes.contact, variant: "outline" },
        ]}
      />
    </>
  )
}
