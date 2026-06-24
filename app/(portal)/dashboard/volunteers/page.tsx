import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChapterMemberActions } from "@/components/portal/chapter-member-actions"
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Volunteers</h1>
          <p className="mt-2 text-muted-foreground">
            Remove volunteers from your chapter. Deleting removes their role,
            linked application, and portal account when they have no other roles.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={routes.portal.admin.volunteerHours}>Volunteer hour approvals</Link>
        </Button>
      </div>

      {volunteers.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No volunteers in your chapter yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {volunteers.map((volunteer) => (
            <Card key={volunteer.userRoleId}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{volunteer.fullName}</CardTitle>
                    <CardDescription>
                      {volunteer.email || "No email on file"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{volunteer.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Chapter: {volunteer.chapterName}</p>
                <ChapterMemberActions
                  userRoleId={volunteer.userRoleId}
                  fullName={volunteer.fullName}
                  memberType="volunteer"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
