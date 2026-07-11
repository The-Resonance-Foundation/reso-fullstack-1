import { getDashboardContext } from "@/lib/auth/dal"
import { getNotificationsForUser, getUnreadNotificationCount } from "@/lib/data/phase45"
import { PortalHeader } from "@/components/portal/portal-header"
import { PortalSidebar, type RoleChip } from "@/components/portal/portal-sidebar"
import type { PortalNavFlags } from "@/components/portal/portal-nav"
import { ROLE_LABELS } from "@/types/roles"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const {
    profile,
    roles,
    canReview,
    isParent,
    isTutor,
    canLogVolunteerHours,
    canAuditMessages,
    canViewDonations,
    canViewAuditLogs,
    canManageChapters,
    canAssignRoles,
    hasPortalRole,
    user,
  } = await getDashboardContext()

  const displayName = profile?.full_name ?? "Member"
  const email = user.email ?? ""

  const flags: PortalNavFlags = {
    isParent,
    isTutor,
    hasPortalRole,
    canLogVolunteerHours,
    canReview,
    canManageChapters,
    canAssignRoles,
    canAuditMessages,
    canViewDonations,
    canViewAuditLogs,
  }

  const roleChips: RoleChip[] = roles.map((role) => ({
    id: role.id,
    label: ROLE_LABELS[role.role],
    chapter: role.chapters?.name ?? null,
  }))

  const [notifications, unreadCount] = hasPortalRole
    ? await Promise.all([
        getNotificationsForUser(),
        getUnreadNotificationCount(),
      ])
    : [[], 0]

  return (
    <div className="flex min-h-screen bg-background">
      <PortalSidebar flags={flags} roleChips={roleChips} />
      <div className="flex min-w-0 flex-1 flex-col">
        <PortalHeader
          displayName={displayName}
          email={email}
          flags={flags}
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}
