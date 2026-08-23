import type { Metadata } from "next"
import Link from "next/link"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How The Resonance Foundation collects, uses, and protects information about families, students, and volunteers.",
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

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl space-y-8 px-4 py-16">
      <div className="space-y-3">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </div>

      <Section title="Who we are">
        <p>
          The Resonance Foundation (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a Texas
          nonprofit organization that provides music education to students through
          volunteer tutors and local chapters. This policy describes how we handle
          information collected through our website and member portal at
          theresonancefoundation.org.
        </p>
      </Section>

      <Section title="Information we collect">
        <p>
          <strong>Account information.</strong> When a parent or guardian enrolls, or a
          tutor, officer, or volunteer joins, we collect their name, email address, and
          optionally a phone number, along with the chapter they belong to.
        </p>
        <p>
          <strong>Student information.</strong> Parents and guardians provide their
          student&rsquo;s name, instrument, and skill level so we can match students
          with tutors and track lesson progress. Student records are created and
          managed only by the parent or guardian and chapter staff — students do not
          create accounts themselves.
        </p>
        <p>
          <strong>Program activity.</strong> We keep records of lessons, practice logs,
          assignments, event RSVPs and attendance, volunteer hours, and service
          certificates as part of running the program.
        </p>
        <p>
          <strong>Messages.</strong> The portal includes messaging between parents and
          program staff. Conversations involving a family are visible to that
          student&rsquo;s parent or guardian, and designated organization leadership
          can review message history for child-safety oversight.
        </p>
        <p>
          <strong>Donations.</strong> Donations are processed by PayPal. We receive and
          store the donation amount, date, and the donor name/email PayPal shares with
          us. We never see or store card or bank numbers.
        </p>
        <p>
          <strong>Technical data.</strong> Standard server logs (such as IP address and
          browser type) and the cookies needed to keep you signed in. We use Cloudflare
          Turnstile to protect our forms from bots.
        </p>
      </Section>

      <Section title="Children's privacy">
        <p>
          Our services are designed for parents, guardians, and program volunteers.
          We do not knowingly collect personal information directly from children
          under 13; information about students is provided by their parent or
          guardian, who consents to its use for program purposes at enrollment.
        </p>
        <p>
          A parent or guardian may review the information we hold about their student,
          ask us to correct it, or ask us to delete it at any time by emailing{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section title="How we use information">
        <p>We use the information above to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>run the program — scheduling lessons, matching tutors, tracking practice and volunteer hours;</li>
          <li>communicate with members — portal messages, announcements, and the emails that accompany them;</li>
          <li>keep students safe — including leadership review of portal conversations;</li>
          <li>issue donation acknowledgments and volunteer service certificates;</li>
          <li>secure and improve the service.</li>
        </ul>
        <p>We do not sell personal information, and we do not use it for advertising.</p>
      </Section>

      <Section title="Who we share it with">
        <p>
          We share information only with the service providers that run our
          infrastructure: Supabase (database and authentication), Vercel (website
          hosting), Resend (transactional email), PayPal (donation processing), and
          Cloudflare (bot protection). Each receives only what it needs to provide its
          service. We may also disclose information when required by law or to protect
          the safety of a child.
        </p>
      </Section>

      <Section title="Retention and deletion">
        <p>
          We keep account and program records while an account is active and for a
          reasonable period afterward for organizational record-keeping. Donation
          records are kept as required for nonprofit accounting. To request deletion of
          your account or your student&rsquo;s information, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section title="Security">
        <p>
          Data is encrypted in transit, access inside the portal is restricted by
          role, and database rules limit every user to the records they are entitled to
          see. No system is perfectly secure, but we design ours so that the least
          possible information is exposed if something goes wrong.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If we make material changes, we will update the date at the top of this page
          and notify active members through the portal.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          The Resonance Foundation ·{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
        <p>
          See also our <Link href={routes.terms} className="text-primary hover:underline">Terms of Service</Link>.
        </p>
      </Section>
    </div>
  )
}
