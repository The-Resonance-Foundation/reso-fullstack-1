import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GuestApplicationHub } from "@/components/portal/guest-application-hub"
import { UpcomingLessonsSummary } from "@/components/portal/lessons-panel"
import { getActiveChapters } from "@/lib/data/chapters"
import {
  formatRoleList,
  getDashboardContext,
  getStaffApplicationsForUser,
} from "@/lib/auth/dal"
import { getLessonsForUser } from "@/lib/data/phase23"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "The Resonance Foundation member portal dashboard.",
}

export default async function DashboardPage() {
  const {
    profile,
    roles,
    roleNames,
    canReview,
    isParent,
    isTutor,
    canLogVolunteerHours,
    canApproveVolunteerHours,
    canAuditMessages,
    canViewDonations,
    canViewAuditLogs,
    canManageEvents,
    canManageChapters,
    canAssignRoles,
    hasPortalRole,
    user,
  } = await getDashboardContext()

  const isGuest = roleNames.length === 0
  const [chapters, pendingApplications, lessons] = isGuest
    ? await Promise.all([getActiveChapters(), getStaffApplicationsForUser(), Promise.resolve([])])
    : isParent
      ? await Promise.all([Promise.resolve([]), Promise.resolve([]), getLessonsForUser()])
      : [[], [], []]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Signed in as {user.email ?? "member"}.
        </p>
      </div>

      {isGuest ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Complete your application</CardTitle>
            <CardDescription>
              You have a portal account but no roles yet. Submit one or more staff
              applications below. Chapter officers review applications on the
              applicants page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GuestApplicationHub
              chapters={chapters}
              pendingApplications={pendingApplications}
              activeRoles={roleNames}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your roles</CardTitle>
            <CardDescription>Active chapter and org permissions</CardDescription>
          </CardHeader>
          <CardContent>
            {roleNames.length ? (
              <p className="text-sm">{formatRoleList(roleNames)}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No roles assigned yet.
              </p>
            )}
            {roles.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {roles.map((role) => (
                  <li key={role.id}>
                    {role.chapters?.name ?? "Organization"}
                    {role.chapters?.name ? " chapter" : ""}
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick links</CardTitle>
            <CardDescription>What you can do today</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {isParent ? (
              <>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.students}>Manage my students</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.lessons}>View lessons</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.practice}>Log practice</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.assignments}>View assignments</Link>
                </Button>
              </>
            ) : null}
            {isTutor ? (
              <>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.tutorStudents}>My students</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.availability}>Set availability</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.calendar}>View calendar</Link>
                </Button>
              </>
            ) : null}
            {hasPortalRole ? (
              <>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.messages}>Messages</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.announcements}>Announcements</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.calendar}>Calendar</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.events}>Events</Link>
                </Button>
              </>
            ) : null}
            {canLogVolunteerHours ? (
              <>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.volunteerHours}>Log volunteer hours</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.volunteerCertificates}>My certificates</Link>
                </Button>
              </>
            ) : null}
            {canReview ? (
              <>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.admin.families}>Review families</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.applicants}>Review applicants</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.admin.tutorAssignments}>
                    Tutor assignments
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.tutors}>Manage tutors</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.volunteers}>Manage volunteers</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.admin.volunteerHours}>
                    Volunteer hour approvals
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.admin.announcements}>
                    Publish announcements
                  </Link>
                </Button>
              </>
            ) : null}
            {canAuditMessages ? (
              <Button asChild variant="outline" className="justify-start">
                <Link href={routes.portal.messagesAudit}>Message audit</Link>
              </Button>
            ) : null}
            {canViewDonations ? (
              <Button asChild variant="outline" className="justify-start">
                <Link href={routes.portal.admin.donations}>Donations</Link>
              </Button>
            ) : null}
            {canViewAuditLogs ? (
              <Button asChild variant="outline" className="justify-start">
                <Link href={routes.portal.admin.auditLogs}>Audit logs</Link>
              </Button>
            ) : null}
            {canApproveVolunteerHours && !canReview ? (
              <Button asChild variant="outline" className="justify-start">
                <Link href={routes.portal.admin.volunteerHours}>
                  Volunteer hour approvals
                </Link>
              </Button>
            ) : null}
            {canManageEvents ? (
              <Button asChild variant="outline" className="justify-start">
                <Link href={routes.portal.events}>Manage events</Link>
              </Button>
            ) : null}
            {canManageChapters ? (
              <Button asChild variant="outline" className="justify-start">
                <Link href={routes.portal.admin.chapters}>Manage chapters</Link>
              </Button>
            ) : null}
            {canAssignRoles ? (
              <Button asChild variant="outline" className="justify-start">
                <Link href={routes.portal.admin.roles}>Assign roles</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="justify-start">
              <Link href={routes.home}>Return to website</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {isParent ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming lessons</CardTitle>
            <CardDescription>Scheduled lessons for your students</CardDescription>
          </CardHeader>
          <CardContent>
            <UpcomingLessonsSummary lessons={lessons} />
          </CardContent>
        </Card>
      ) : null}

      {hasPortalRole ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Portal features</CardTitle>
            <CardDescription>
              Lessons, messaging, volunteer hours, events, and calendar are live.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use the sidebar or quick links above. Tutor–student messages include
              parents by default — see the banner in each thread.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
