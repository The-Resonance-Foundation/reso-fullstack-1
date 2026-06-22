import Link from "next/link"
import { Music } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
  canManageChapters: boolean
  canAssignRoles: boolean
}

const upcomingFeatures = [
  "Upcoming Lessons",
  "Practice Log",
  "Assignments",
  "Messages",
  "Availability",
  "Calendar",
  "Events",
] as const

export function PortalSidebar({
  roles,
  roleNames,
  canReview,
  isParent,
  canManageChapters,
  canAssignRoles,
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
              <Link
                href={routes.portal.dashboard}
                className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Dashboard
              </Link>
            </li>
            {isParent ? (
              <li>
                <Link
                  href={routes.portal.students}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  My Students
                </Link>
              </li>
            ) : null}
            {canReview ? (
              <>
                <li>
                  <Link
                    href={routes.portal.admin.families}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Families
                  </Link>
                </li>
                <li>
                  <Link
                    href={routes.portal.applicants}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Applicants
                  </Link>
                </li>
                <li>
                  <Link
                    href={routes.portal.tutors}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Tutors
                  </Link>
                </li>
                <li>
                  <Link
                    href={routes.portal.volunteers}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Volunteers
                  </Link>
                </li>
              </>
            ) : null}
          </ul>
        </div>

        {canManageChapters || canAssignRoles ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Administration
            </p>
            <ul className="space-y-1">
              {canManageChapters ? (
                <li>
                  <Link
                    href={routes.portal.admin.chapters}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Chapters
                  </Link>
                </li>
              ) : null}
              {canAssignRoles ? (
                <li>
                  <Link
                    href={routes.portal.admin.roles}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Role assignments
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Coming in Phase 2+
          </p>
          <ul className="space-y-1">
            {upcomingFeatures.map((item) => (
              <li key={item}>
                <span className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground">
                  {item}
                  <Badge variant="outline" className="text-[10px]">
                    Soon
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        </div>
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
