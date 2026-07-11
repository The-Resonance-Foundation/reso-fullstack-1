import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AddResourceDialog, ResourcesList } from "@/components/portal/resources-panel"
import { PageHeader } from "@/components/portal/page-header"
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
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Chapter documents"
        description="Policies, handbooks, and chapter-wide resources."
        actions={<AddResourceDialog chapters={chapters} />}
      />

      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle className="text-lg">Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {/* canDelete reflects the same review permission that gates this
              page — previously hardcoded to true regardless of the viewer's
              actual authorization. */}
          <ResourcesList resources={docs} canDelete={allowed} />
        </CardContent>
      </Card>
    </div>
  )
}
