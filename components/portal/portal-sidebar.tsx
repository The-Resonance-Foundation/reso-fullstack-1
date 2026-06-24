import Link from "next/link"
import { Music } from "lucide-react"
import { formatRoleList } from "@/lib/auth/dal"
import { routes } from "@/lib/routes"
import type { UserRoleWithChapter } from "@/lib/auth/dal"
import type { AppRole } from "@/types/enums"
import { ROLE_LABELS } from "@/types/roles"

type PortalSidebarProps = {
  roles: UserRoleWithChapter[]
  roleNames: AppRole[]
  canReview: boolean
  isParent: boolean
  isTutor: boolean
  canLogVolunteerHours: boolean
  canAuditMessages: boolean
  canViewDonations: boolean
  canViewAuditLogs: boolean
  canManageLessons: boolean
  canManageEvents: boolean
  canManageChapters: boolean
  canAssignRoles: boolean
  hasPortalRole: boolean
}

const linkClass =
  "block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"

export function PortalSidebar({
  roles,
  roleNames,
  canReview,
  isParent,
  isTutor,
  canLogVolunteerHours,
  canAuditMessages,
  canViewDonations,
  canViewAuditLogs,
  canManageLessons,
  canManageEvents,
  canManageChapters,
  canAssignRoles,
  hasPortalRole,
}: PortalSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <Music className="h-6 w-6 text-primary" />
        <span className="font-serif text-sm font-bold">Portal</span>
      </div>

      <nav className="space-y-6 p-4" aria-label="Portal navigation">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Main
          </p>
          <ul className="space-y-1">
            <li>
              <Link href={routes.portal.dashboard} className={linkClass}>
                Dashboard
              </Link>
            </li>
            {isParent ? (
              <>
                <li>
                  <Link href={routes.portal.students} className={linkClass}>
                    My Students
                  </Link>
                </li>
                <li>
                  <Link href={routes.portal.lessons} className={linkClass}>
                    Lessons
                  </Link>
                </li>
                <li>
                  <Link href={routes.portal.practice} className={linkClass}>
                    Practice Log
                  </Link>
                </li>
                <li>
                  <Link href={routes.portal.assignments} className={linkClass}>
                    Assignments
                  </Link>
                </li>
              </>
            ) : null}
            {isTutor ? (
              <>
                <li>
                  <Link href={routes.portal.tutorStudents} className={linkClass}>
                    My Students
                  </Link>
                </li>
                <li>
                  <Link href={routes.portal.lessons} className={linkClass}>
                    All lessons
                  </Link>
                </li>
                <li>
                  <Link href={routes.portal.availability} className={linkClass}>
                    Availability
                  </Link>
                </li>
                <li>
                  <Link href={routes.portal.assignments} className={linkClass}>
                    All assignments
                  </Link>
                </li>
              </>
            ) : null}
            {hasPortalRole ? (
              <>
                <li>
                  <Link href={routes.portal.messages} className={linkClass}>
                    Messages
                  </Link>
                </li>
                <li>
                  <Link href={routes.portal.announcements} className={linkClass}>
                    Announcements
                  </Link>
                </li>
                <li>
                  <Link href={routes.portal.calendar} className={linkClass}>
                    Calendar
                  </Link>
                </li>
                <li>
                  <Link href={routes.portal.events} className={linkClass}>
                    Events
                  </Link>
                </li>
                <li>
                  <Link href={routes.portal.resources} className={linkClass}>
                    Resources
                  </Link>
                </li>
              </>
            ) : null}
            {canLogVolunteerHours ? (
              <>
                <li>
                  <Link href={routes.portal.volunteerHours} className={linkClass}>
                    Volunteer hours
                  </Link>
                </li>
                <li>
                  <Link href={routes.portal.volunteerCertificates} className={linkClass}>
                    Certificates
                  </Link>
                </li>
              </>
            ) : null}
            {canReview ? (
              <>
                <li>
                  <Link href={routes.portal.admin.families} className={linkClass}>
                    Families
                  </Link>
                </li>
                <li>
                  <Link href={routes.portal.applicants} className={linkClass}>
                    Applicants
                  </Link>
                </li>
                <li>
                  <Link href={routes.portal.tutors} className={linkClass}>
                    Tutors
                  </Link>
                </li>
                <li>
                  <Link href={routes.portal.volunteers} className={linkClass}>
                    Volunteers
                  </Link>
                </li>
              </>
            ) : null}
          </ul>
        </div>

        {canManageChapters || canAssignRoles || canReview || canManageEvents ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Administration
            </p>
            <ul className="space-y-1">
              {canManageChapters ? (
                <li>
                  <Link href={routes.portal.admin.chapters} className={linkClass}>
                    Chapters
                  </Link>
                </li>
              ) : null}
              {canAssignRoles ? (
                <li>
                  <Link href={routes.portal.admin.roles} className={linkClass}>
                    Role assignments
                  </Link>
                </li>
              ) : null}
              {canReview ? (
                <>
                  <li>
                    <Link
                      href={routes.portal.admin.tutorAssignments}
                      className={linkClass}
                    >
                      Tutor assignments
                    </Link>
                  </li>
                  <li>
                    <Link href={routes.portal.admin.volunteerHours} className={linkClass}>
                      Volunteer approvals
                    </Link>
                  </li>
                  <li>
                    <Link href={routes.portal.admin.announcements} className={linkClass}>
                      Publish announcements
                    </Link>
                  </li>
                  <li>
                    <Link href={routes.portal.admin.docs} className={linkClass}>
                      Chapter docs
                    </Link>
                  </li>
                </>
              ) : null}
              {canAuditMessages ? (
                <li>
                  <Link href={routes.portal.messagesAudit} className={linkClass}>
                    Message audit
                  </Link>
                </li>
              ) : null}
              {canViewDonations ? (
                <li>
                  <Link href={routes.portal.admin.donations} className={linkClass}>
                    Donations
                  </Link>
                </li>
              ) : null}
              {canViewAuditLogs ? (
                <li>
                  <Link href={routes.portal.admin.auditLogs} className={linkClass}>
                    Audit logs
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        {!hasPortalRole ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Coming soon
            </p>
            <p className="px-3 text-xs text-muted-foreground">
              Lessons and messaging unlock after your application is accepted.
            </p>
          </div>
        ) : null}
      </nav>

      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">Your roles</p>
        <p className="mt-1 text-sm font-medium">
          {roleNames.length ? formatRoleList(roleNames) : "No active roles"}
        </p>
        {roles.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {roles.map((role) => (
              <li key={role.id} className="text-xs text-muted-foreground">
                {ROLE_LABELS[role.role]}
                {role.chapters?.name ? ` · ${role.chapters.name}` : ""}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  )
}
