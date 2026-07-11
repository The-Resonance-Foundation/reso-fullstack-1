import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ApplicantPipeline } from "@/components/portal/applicant-pipeline"
import { PageHeader } from "@/components/portal/page-header"
import { canReviewApplicants, getApplicantsForReviewer } from "@/lib/auth/dal"

export const metadata: Metadata = {
  title: "Applicants",
  description: "Review tutor, officer, and volunteer applications.",
}

export default async function ApplicantsPage() {
  const allowed = await canReviewApplicants()
  if (!allowed) redirect("/dashboard")

  const applicants = await getApplicantsForReviewer()

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Applicant pipeline"
        description="Review tutor, officer, and volunteer applications from members who already have portal accounts. Accepting grants the role and provisions access immediately; rejecting sends a notification email when Resend is configured."
      />
      <ApplicantPipeline applicants={applicants} />
    </div>
  )
}
