import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChapterForm } from "@/components/portal/chapter-form"
import { canManageChapters, getAllChapters } from "@/lib/auth/dal"

export const metadata: Metadata = {
  title: "Manage Chapters",
  description: "Create and update organization chapters.",
}

export default async function AdminChaptersPage() {
  const allowed = await canManageChapters()
  if (!allowed) redirect("/dashboard")

  const chapters = await getAllChapters()

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Chapters</h1>
        <p className="mt-2 text-muted-foreground">
          Board members can create and update chapters used across enrollment and
          role assignment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add chapter</CardTitle>
        </CardHeader>
        <CardContent>
          <ChapterForm />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {chapters.map((chapter) => (
          <Card key={chapter.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">{chapter.name}</CardTitle>
                <Badge variant="outline">{chapter.status}</Badge>
              </div>
              <CardDescription>
                {chapter.slug}
                {chapter.city ? ` · ${chapter.city}, ${chapter.state}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChapterForm chapter={chapter} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
