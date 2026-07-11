import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { AnnouncementList } from "@/components/portal/announcements-panel"
import { PageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
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
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title="Announcements"
        description="Updates from your chapter and the organization."
        actions={
          canPublish ? (
            <Button asChild variant="outline" size="sm">
              <Link href={routes.portal.admin.announcements}>Publish</Link>
            </Button>
          ) : null
        }
      />

      <AnnouncementList announcements={announcements} />
    </div>
  )
}
