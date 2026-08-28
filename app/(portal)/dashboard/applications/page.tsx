import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ApplicationsAccordion } from "@/components/portal/applications-accordion"
import { PageHeader } from "@/components/portal/page-header"
import { StatusBadge } from "@/components/portal/status-badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getActiveChapters } from "@/lib/data/chapters"
import {
  getActiveRoleNames,
  getStaffApplicationsForUser,
  verifySession,
} from "@/lib/auth/dal"
import { routes } from "@/lib/routes"
import { ROLE_LABELS } from "@/types/roles"
import type { Applicant } from "@/types/database"

export const metadata: Metadata = {
  title: "Applications",
  description: "Apply for a position with The Resonance Foundation.",
}

const APPLIED_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

function positionLabel(app: Applicant) {
  if (app.type === "officer" && app.requested_role) {
    return ROLE_LABELS[app.requested_role]
  }
  return app.type.charAt(0).toUpperCase() + app.type.slice(1)
}

export default async function ApplicationsPage() {
  await verifySession()
  const roleNames = await getActiveRoleNames()

  // Members who already hold a role are onboarded by administrators instead.
  if (roleNames.length > 0) {
    redirect(routes.portal.dashboard)
  }

  const [chapters, applications] = await Promise.all([
    getActiveChapters(),
    getStaffApplicationsForUser(),
  ])

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title="Applications"
        description="Pick the position that fits you and tell us a little about yourself. Reviews usually happen within a few days, and you will get an email either way."
      />

      {applications.length > 0 ? (
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="text-base">Your applications</CardTitle>
            <CardDescription>
              Everything you have submitted so far and where it stands.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border px-3 py-2.5"
              >
                <span className="text-sm font-medium">{positionLabel(app)}</span>
                <span className="text-xs text-muted-foreground">
                  {app.chapters?.name ?? "Corporate"} ·{" "}
                  {APPLIED_DATE.format(new Date(app.created_at))}
                </span>
                <span className="ml-auto">
                  <StatusBadge status={app.stage} />
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle className="text-base">Open positions</CardTitle>
          <CardDescription>
            Expand a position to read about it and apply. Chapter roles belong
            to one chapter; corporate roles serve the whole organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApplicationsAccordion chapters={chapters} applications={applications} />
        </CardContent>
      </Card>
    </div>
  )
}
