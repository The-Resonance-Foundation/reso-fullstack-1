import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ApplicantStageActions } from "@/components/portal/applicant-stage-actions"
import { ApplicantManagementActions } from "@/components/portal/applicant-management-actions"
import { canReviewApplicants, getApplicantsForReviewer } from "@/lib/auth/dal"
import { ROLE_LABELS } from "@/types/roles"

export const metadata: Metadata = {
  title: "Applicants",
  description: "Review tutor, officer, and volunteer applications.",
}

export default async function ApplicantsPage() {
  const allowed = await canReviewApplicants()
  if (!allowed) redirect("/dashboard")

  const applicants = await getApplicantsForReviewer()

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Staff applicants</h1>
        <p className="mt-2 text-muted-foreground">
          Review tutor, officer, and volunteer applications from members who already
          have portal accounts. Accepting grants the role immediately; rejecting sends
          a notification email when Resend is configured.
        </p>
      </div>

      {applicants.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No applications to review yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applicants.map((applicant) => (
            <Card key={applicant.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{applicant.full_name}</CardTitle>
                    <CardDescription>
                      {applicant.email}
                      {applicant.phone ? ` · ${applicant.phone}` : ""}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{applicant.type}</Badge>
                    <Badge
                      variant="outline"
                      className={
                        applicant.stage === "rejected"
                          ? "border-destructive text-destructive"
                          : undefined
                      }
                    >
                      {applicant.stage}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Chapter: {applicant.chapters?.name ?? applicant.chapter_id}
                </p>
                {applicant.type === "officer" && applicant.requested_role ? (
                  <p>
                    Requested position:{" "}
                    {ROLE_LABELS[applicant.requested_role]}
                  </p>
                ) : null}
                {applicant.instrument ? <p>Instrument: {applicant.instrument}</p> : null}
                {applicant.message ? <p>Notes: {applicant.message}</p> : null}
                {applicant.stage === "active" ? (
                  <p className="text-primary">Active member.</p>
                ) : applicant.stage === "rejected" ? (
                  <p className="text-destructive">Application rejected.</p>
                ) : null}
                <ApplicantStageActions
                  applicantId={applicant.id}
                  currentStage={applicant.stage}
                />
                <ApplicantManagementActions
                  applicantId={applicant.id}
                  fullName={applicant.full_name}
                  stage={applicant.stage}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
