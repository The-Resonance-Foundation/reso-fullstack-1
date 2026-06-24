import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AnnouncementForm } from "@/components/portal/messaging-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { canReviewApplicants, getUserRoles } from "@/lib/auth/dal"
import { isBoard } from "@/types/enums"
import { getActiveChapters } from "@/lib/data/chapters"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Publish announcement",
  description: "Send chapter or organization announcements.",
}

export default async function AdminAnnouncementsPage() {
  const [canReview, roles, allChapters] = await Promise.all([
    canReviewApplicants(),
    getUserRoles(),
    getActiveChapters(),
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Publish announcement</h1>
        <p className="mt-2 text-muted-foreground">
          Chapter officers and presidents can publish to their chapter. Board members
          can publish organization-wide announcements.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">New announcement</CardTitle>
          <CardDescription>
            Members receive an in-app notification when published
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnnouncementForm chapters={chapters} />
        </CardContent>
      </Card>
    </div>
  )
}
