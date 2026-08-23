import type { Metadata } from "next"
import Link from "next/link"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern use of The Resonance Foundation website and member portal.",
}

const LAST_UPDATED = "August 23, 2026"
const CONTACT_EMAIL = "administrator@theresonancefoundation.org"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-foreground/85">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl space-y-8 px-4 py-16">
      <div className="space-y-3">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-foreground/80">
          These terms are a working draft prepared by The Resonance Foundation and are
          pending review by legal counsel. Questions are welcome at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>

      <Section title="Acceptance of these terms">
        <p>
          By creating an account on or using the website and member portal of The
          Resonance Foundation, a Texas nonprofit organization, you agree to these
          terms and to our{" "}
          <Link href={routes.privacy} className="text-primary hover:underline">
            Privacy Policy
          </Link>
          . If you do not agree, please do not use the portal.
        </p>
      </Section>

      <Section title="Who may create an account">
        <p>
          Accounts may only be created by adults (18 or older): parents or guardians
          enrolling their students, and tutors, chapter officers, and volunteers
          joining the program. Students participate through their parent or
          guardian&rsquo;s account and do not hold accounts themselves.
        </p>
        <p>
          You are responsible for the accuracy of the information you provide and for
          keeping your login credentials secure. Parents and guardians are responsible
          for the student information they add to the portal.
        </p>
      </Section>

      <Section title="Community conduct">
        <p>
          The portal exists to support music education for young students. You agree
          to use it accordingly:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>be respectful in messages and announcements — no harassment, abuse, or inappropriate content;</li>
          <li>use messaging only for program-related communication;</li>
          <li>do not attempt to access records that are not yours or probe the security of the service;</li>
          <li>do not upload content you do not have the right to share.</li>
        </ul>
        <p>
          For child-safety reasons, portal conversations involving families are
          visible to the student&rsquo;s parent or guardian, and designated
          organization leadership may review message history. Portal communication is
          not private from the organization.
        </p>
      </Section>

      <Section title="Volunteers and tutors">
        <p>
          Tutor, officer, and volunteer roles are granted and may be revoked at the
          organization&rsquo;s discretion. Volunteer hours are recorded in the portal
          and reviewed by chapter leadership before approval; service certificates
          reflect approved hours only.
        </p>
      </Section>

      <Section title="Donations">
        <p>
          Donations are processed by PayPal and support our nonprofit mission.
          Donations are not fees for services and are generally non-refundable; for
          questions about a donation, contact{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section title="Our content">
        <p>
          The website, portal, and materials we share (other than content you submit)
          belong to The Resonance Foundation or are used with permission. You may not
          copy or redistribute them outside the program without our consent.
        </p>
      </Section>

      <Section title="Disclaimers and limitation of liability">
        <p>
          The portal is provided &ldquo;as is&rdquo; without warranties of any kind.
          To the fullest extent permitted by law, The Resonance Foundation is not
          liable for indirect, incidental, or consequential damages arising from use
          of the service. Nothing in these terms limits liability that cannot be
          limited under applicable law.
        </p>
      </Section>

      <Section title="Ending an account">
        <p>
          You may stop using the portal and request account deletion at any time. We
          may suspend or remove accounts that violate these terms or put members at
          risk.
        </p>
      </Section>

      <Section title="Governing law and changes">
        <p>
          These terms are governed by the laws of the State of Texas. If we make
          material changes, we will update the date at the top of this page and notify
          active members through the portal.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          The Resonance Foundation ·{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>
    </div>
  )
}
