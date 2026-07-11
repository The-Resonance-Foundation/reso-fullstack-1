import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/portal/page-header"
import { AssignRoleDialog } from "@/components/portal/role-assignment-form"
import { RoleAssignmentsTabs } from "@/components/portal/role-assignments-table"
import {
  canAssignRoles,
  getAllChapters,
  getPortalMembers,
  getRoleAssignments,
} from "@/lib/auth/dal"

export const metadata: Metadata = {
  title: "Roles & Permissions",
  description: "Assign and remove portal roles.",
}

export default async function AdminRolesPage() {
  const allowed = await canAssignRoles()
  if (!allowed) redirect("/dashboard")

  const [assignments, chapters, members] = await Promise.all([
    getRoleAssignments(),
    getAllChapters(),
    getPortalMembers(),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Roles & permissions"
        description="Assign and manage chapter or organization-wide roles for portal members in your scope."
        actions={<AssignRoleDialog chapters={chapters} members={members} />}
      />

      <RoleAssignmentsTabs
        assignments={assignments}
        chapters={chapters}
        members={members}
      />
    </div>
  )
}
