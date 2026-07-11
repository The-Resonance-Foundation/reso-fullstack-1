import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AddResourceDialog, ResourcesList } from "@/components/portal/resources-panel"
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  canManageLessons,
  canAccessPortalFeatures,
  getUserRoles,
  isTutorAccount,
} from "@/lib/auth/dal"
import {
  getAssignedStudentsForTutor,
  getResourcesForUser,
} from "@/lib/data/phase23"

export const metadata: Metadata = {
  title: "Resources",
  description: "Sheet music, links, and learning materials.",
}

export default async function ResourcesPage() {
  const [isTutor, canManage, hasRole, roles] = await Promise.all([
    isTutorAccount(),
    canManageLessons(),
    canAccessPortalFeatures(),
    getUserRoles(),
  ])

  if (!hasRole) redirect("/dashboard")

  const chapterOptions = roles
    .filter((r) => r.chapter_id)
    .reduce(
      (acc, r) => {
        if (!r.chapter_id) return acc
        if (!acc.some((c) => c.id === r.chapter_id)) {
          acc.push({
            id: r.chapter_id,
            name: r.chapters?.name ?? "Chapter",
            slug: r.chapters?.slug ?? "",
            city: null,
            state: null,
            status: "active" as const,
            created_at: "",
          })
        }
        return acc
      },
      [] as Array<{
        id: string
        name: string
        slug: string
        city: null
        state: null
        status: "active"
        created_at: string
      }>
    )

  const [resources, assignedStudents] = await Promise.all([
    getResourcesForUser(),
    isTutor ? getAssignedStudentsForTutor() : Promise.resolve([]),
  ])

  const canAddResources = isTutor || canManage

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Resources"
        description="Chapter and student-specific learning materials."
        actions={
          canAddResources ? (
            <AddResourceDialog
              chapters={chapterOptions}
              students={isTutor ? assignedStudents : undefined}
            />
          ) : null
        }
      />

      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle className="text-lg">Available resources</CardTitle>
        </CardHeader>
        <CardContent>
          <ResourcesList resources={resources} canDelete={canManage} />
        </CardContent>
      </Card>
    </div>
  )
}
