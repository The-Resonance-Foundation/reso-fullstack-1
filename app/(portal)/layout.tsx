import { getDashboardContext } from "@/lib/auth/dal"
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
    canManageChapters,
    canAssignRoles,
  } = await getDashboardContext()
  const displayName = profile?.full_name ?? "Member"

  return (
    <div className="flex min-h-screen bg-muted/30">
      <PortalSidebar
        roles={roles}
        roleNames={roleNames}
        canReview={canReview}
        isParent={isParent}
        canManageChapters={canManageChapters}
        canAssignRoles={canAssignRoles}
      />
      <div className="flex flex-1 flex-col">
        <PortalHeader displayName={displayName} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
