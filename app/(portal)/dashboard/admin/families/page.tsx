import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { FamilyReviewPanel } from "@/components/portal/family-review-panel"
import { PageHeader } from "@/components/portal/page-header"
import { canReviewApplicants, getFamiliesForReviewer } from "@/lib/auth/dal"

export const metadata: Metadata = {
  title: "Families",
  description: "Review parent households and student enrollments.",
}

export default async function AdminFamiliesPage() {
  const allowed = await canReviewApplicants()
  if (!allowed) redirect("/dashboard")

  const families = await getFamiliesForReviewer()

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Families & enrollments"
        description="Registered parents in your chapter and the students linked to each household. Parents appear here after signup; students appear once the parent adds them in the portal."
      />
      <FamilyReviewPanel families={families} />
    </div>
  )
}
