import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AnnouncementComposer, AnnouncementList } from "@/components/portal/announcements-panel"
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { canReviewApplicants, getUserRoles } from "@/lib/auth/dal"
import { isBoard } from "@/types/enums"
import { getActiveChapters } from "@/lib/data/chapters"
import { getAnnouncementsForUser } from "@/lib/data/phase45"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Publish announcements",
  description: "Send chapter or organization announcements.",
}

export default async function AdminAnnouncementsPage() {
  const [canReview, roles, allChapters, announcements] = await Promise.all([
    canReviewApplicants(),
    getUserRoles(),
    getActiveChapters(),
    getAnnouncementsForUser(),
  ])

  const roleNames = roles.map((r) => r.role)
  const board = isBoard(roleNames)

  if (!canReview && !board) redirect("/dashboard")

  const officerChapters = roles
    .filter((r) =>
      ["chapter_officer", "chapter_president"].includes(r.role) && r.chapter_id
    )
    .reduce<{ id: string; name: string }[]>((acc, r) => {
      if (!r.chapter_id || acc.some((c) => c.id === r.chapter_id)) return acc
      acc.push({ id: r.chapter_id, name: r.chapters?.name ?? "Chapter" })
      return acc
    }, [])

  const chapters = board
    ? allChapters.map((c) => ({ id: c.id, name: c.name }))
    : officerChapters

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title="Publish announcements"
        description="Chapter officers and presidents can publish to their chapter. Board members can publish organization-wide announcements."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">New announcement</CardTitle>
          <CardDescription>
            Members receive an in-app notification when published
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnnouncementComposer chapters={chapters} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent announcements</CardTitle>
          <CardDescription>Newest first</CardDescription>
        </CardHeader>
        <CardContent>
          <AnnouncementList announcements={announcements} />
        </CardContent>
      </Card>
    </div>
  )
}
