import { getDashboardContext } from "@/lib/auth/dal"
import { getNotificationsForUser, getUnreadNotificationCount } from "@/lib/data/phase45"
import { getNavBadges } from "@/lib/data/nav-badges"
import { AuroraBackground } from "@/components/portal/aurora-background"
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
    canApproveVolunteerHours,
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
    canApproveHours: canApproveVolunteerHours,
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

  const [notifications, unreadCount, badges] = hasPortalRole
    ? await Promise.all([
        getNotificationsForUser(),
        getUnreadNotificationCount(),
        getNavBadges(),
      ])
    : [[], 0, {}]

  return (
    <div className="dark portal-aurora relative min-h-dvh bg-background text-foreground">
      <AuroraBackground />
      <div className="relative z-10 flex h-dvh flex-col lg:p-5">
        <div className="glass-shell flex min-h-0 flex-1 overflow-hidden lg:rounded-[26px]">
          <PortalSidebar flags={flags} roleChips={roleChips} badges={badges} />
          <div className="flex min-w-0 flex-1 flex-col">
            <PortalHeader
              displayName={displayName}
              email={email}
              flags={flags}
              roleChips={roleChips}
              badges={badges}
              notifications={notifications}
              unreadCount={unreadCount}
            />
            <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-7 md:py-7">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
