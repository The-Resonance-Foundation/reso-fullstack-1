import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ResourceForm, ResourcesList } from "@/components/portal/resources-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { canReviewApplicants, getAllChapters } from "@/lib/auth/dal"
import { getChapterDocs } from "@/lib/data/phase23"

export const metadata: Metadata = {
  title: "Chapter documents",
  description: "Chapter-wide documents and resources.",
}

export default async function ChapterDocsPage() {
  const allowed = await canReviewApplicants()
  if (!allowed) redirect("/dashboard")

  const [chapters, docs] = await Promise.all([
    getAllChapters(),
    getChapterDocs(),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Chapter documents</h1>
        <p className="mt-2 text-muted-foreground">
          Policies, handbooks, and chapter-wide resources.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add document</CardTitle>
        </CardHeader>
        <CardContent>
          <ResourceForm chapters={chapters} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <ResourcesList resources={docs} canDelete />
        </CardContent>
      </Card>
    </div>
  )
}
