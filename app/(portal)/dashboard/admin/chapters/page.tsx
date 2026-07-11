import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Building2, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/portal/page-header"
import { EditChapterDialog, NewChapterDialog } from "@/components/portal/chapter-form"
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
      <PageHeader
        title="Chapters"
        description="Board members can create and update chapters used across enrollment and role assignment."
        actions={<NewChapterDialog />}
      />

      {chapters.length === 0 ? (
        <EmptyState
          icon={<Building2 aria-hidden />}
          title="No chapters yet"
          description="Create your first chapter to start enrolling members and assigning roles."
          action={<NewChapterDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chapters.map((chapter) => (
            <Card key={chapter.id} className="animate-fade-up flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{chapter.name}</CardTitle>
                  <Badge
                    className={
                      chapter.status === "active"
                        ? "bg-success/15 text-success border-transparent"
                        : "bg-destructive/15 text-destructive border-transparent"
                    }
                  >
                    {chapter.status.charAt(0).toUpperCase() + chapter.status.slice(1)}
                  </Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  {chapter.slug}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                {chapter.city ? (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {chapter.city}
                    {chapter.state ? `, ${chapter.state}` : ""}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Location not set</p>
                )}
                <div className="flex justify-end">
                  <EditChapterDialog chapter={chapter} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
