import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { AnnouncementsList } from "@/components/portal/messaging-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { canReviewApplicants, getDashboardContext } from "@/lib/auth/dal"
import { getAnnouncementsForUser } from "@/lib/data/phase45"
import { routes } from "@/lib/routes"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Announcements",
  description: "Chapter and organization announcements.",
}

export default async function AnnouncementsPage() {
  const { hasPortalRole } = await getDashboardContext()
  if (!hasPortalRole) redirect("/dashboard")

  const [announcements, canPublish] = await Promise.all([
    getAnnouncementsForUser(),
    canReviewApplicants(),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Announcements</h1>
          <p className="mt-2 text-muted-foreground">
            Updates from your chapter and the organization.
          </p>
        </div>
        {canPublish ? (
          <Button asChild variant="outline" size="sm">
            <Link href={routes.portal.admin.announcements}>Publish</Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent announcements</CardTitle>
          <CardDescription>Newest first</CardDescription>
        </CardHeader>
        <CardContent>
          <AnnouncementsList announcements={announcements} />
        </CardContent>
      </Card>
    </div>
  )
}
