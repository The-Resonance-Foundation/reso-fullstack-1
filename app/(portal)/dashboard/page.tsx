import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GuestApplicationHub } from "@/components/portal/guest-application-hub"
import { getActiveChapters } from "@/lib/data/chapters"
import {
  formatRoleList,
  getDashboardContext,
  getStaffApplicationsForUser,
} from "@/lib/auth/dal"
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
    canManageChapters,
    canAssignRoles,
    user,
  } = await getDashboardContext()

  const isGuest = roleNames.length === 0
  const [chapters, pendingApplications] = isGuest
    ? await Promise.all([getActiveChapters(), getStaffApplicationsForUser()])
    : [[], []]

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
              <Button asChild variant="outline" className="justify-start">
                <Link href={routes.portal.students}>Manage my students</Link>
              </Button>
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
                  <Link href={routes.portal.tutors}>Manage tutors</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href={routes.portal.volunteers}>Manage volunteers</Link>
                </Button>
              </>
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

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">On the roadmap</CardTitle>
          <CardDescription>
            Phase 2 adds lessons, practice logs, assignments, and messaging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your sidebar shows planned navigation. Lessons and chapter calendar tools
            arrive in the next build phases.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
