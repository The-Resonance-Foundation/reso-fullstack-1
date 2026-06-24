import { getDashboardContext } from "@/lib/auth/dal"
import { getNotificationsForUser, getUnreadNotificationCount } from "@/lib/data/phase45"
import { PortalHeader } from "@/components/portal/portal-header"
import { PortalSidebar } from "@/components/portal/portal-sidebar"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const {
    profile,
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
  } = await getDashboardContext()
  const displayName = profile?.full_name ?? "Member"

  const [notifications, unreadCount] = hasPortalRole
    ? await Promise.all([
        getNotificationsForUser(),
        getUnreadNotificationCount(),
      ])
    : [[], 0]

  return (
    <div className="flex min-h-screen bg-muted/30">
      <PortalSidebar
        roles={roles}
        roleNames={roleNames}
        canReview={canReview}
        isParent={isParent}
        isTutor={isTutor}
        canLogVolunteerHours={canLogVolunteerHours}
        canAuditMessages={canAuditMessages}
        canViewDonations={canViewDonations}
        canViewAuditLogs={canViewAuditLogs}
        canManageLessons={canManageLessons}
        canManageEvents={canManageEvents}
        canManageChapters={canManageChapters}
        canAssignRoles={canAssignRoles}
        hasPortalRole={hasPortalRole}
      />
      <div className="flex flex-1 flex-col">
        <PortalHeader
          displayName={displayName}
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
