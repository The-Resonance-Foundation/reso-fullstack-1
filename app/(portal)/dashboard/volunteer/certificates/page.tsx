import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Clock } from "lucide-react"
import { CertificatesGrid } from "@/components/portal/certificates-grid"
import { PageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { canLogVolunteerHours } from "@/lib/auth/dal"
import { getCertificatesForUser } from "@/lib/data/phase45"
import { routes } from "@/lib/routes"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Certificates",
  description: "Download volunteer service certificates.",
}

export default async function VolunteerCertificatesPage() {
  const allowed = await canLogVolunteerHours()
  if (!allowed) redirect("/dashboard")

  const certificates = await getCertificatesForUser()

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Certificates"
        description="PDF certificates are generated when your volunteer hours are approved."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={routes.portal.volunteerHours}>
              <Clock aria-hidden />
              Log hours
            </Link>
          </Button>
        }
      />

      <CertificatesGrid certificates={certificates} />
    </div>
  )
}
