import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ChapterMembersTable } from "@/components/portal/chapter-member-actions"
import { PageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { canReviewApplicants, getVolunteersForReviewer } from "@/lib/auth/dal"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Volunteers",
  description: "Manage chapter volunteers.",
}

export default async function VolunteersPage() {
  const allowed = await canReviewApplicants()
  if (!allowed) redirect("/dashboard")

  const volunteers = await getVolunteersForReviewer()

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Volunteers"
        description="Manage chapter volunteers. Removing a volunteer deletes their role, linked application, and portal account when they have no other roles."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={routes.portal.admin.volunteerHours}>Volunteer hour approvals</Link>
          </Button>
        }
      />
      <ChapterMembersTable members={volunteers} memberType="volunteer" />
    </div>
  )
}
