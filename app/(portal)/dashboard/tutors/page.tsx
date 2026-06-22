import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChapterMemberActions } from "@/components/portal/chapter-member-actions"
import { canReviewApplicants, getTutorsForReviewer } from "@/lib/auth/dal"

export const metadata: Metadata = {
  title: "Tutors",
  description: "Manage chapter tutors.",
}

export default async function TutorsPage() {
  const allowed = await canReviewApplicants()
  if (!allowed) redirect("/dashboard")

  const tutors = await getTutorsForReviewer()

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Tutors</h1>
        <p className="mt-2 text-muted-foreground">
          Remove tutors from your chapter. Deleting a tutor removes their role,
          linked tutor application, and their portal account when they have no
          other roles.
        </p>
      </div>

      {tutors.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No tutors in your chapter yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tutors.map((tutor) => (
            <Card key={tutor.userRoleId}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{tutor.fullName}</CardTitle>
                    <CardDescription>
                      {tutor.email || "No email on file"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{tutor.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Chapter: {tutor.chapterName}</p>
                <ChapterMemberActions
                  userRoleId={tutor.userRoleId}
                  fullName={tutor.fullName}
                  memberType="tutor"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
