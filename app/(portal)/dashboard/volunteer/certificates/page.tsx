import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CertificatesList } from "@/components/portal/volunteer-hours-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Certificates</h1>
          <p className="mt-2 text-muted-foreground">
            PDF certificates are generated when your volunteer hours are approved.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={routes.portal.volunteerHours}>Log hours</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your certificates</CardTitle>
          <CardDescription>Download approved service records</CardDescription>
        </CardHeader>
        <CardContent>
          <CertificatesList certificates={certificates} />
        </CardContent>
      </Card>
    </div>
  )
}
