import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ChapterMembersTable } from "@/components/portal/chapter-member-actions"
import { PageHeader } from "@/components/portal/page-header"
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
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Tutors"
        description="Manage chapter tutors. Removing a tutor deletes their role, linked application, and portal account when they have no other roles."
      />
      <ChapterMembersTable members={tutors} memberType="tutor" />
    </div>
  )
}
