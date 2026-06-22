import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AssignRoleForm,
  RemoveRoleButton,
} from "@/components/portal/role-assignment-form"
import {
  canAssignRoles,
  getAllChapters,
  getPortalMembers,
  getRoleAssignments,
} from "@/lib/auth/dal"
import { ROLE_LABELS } from "@/types/roles"

export const metadata: Metadata = {
  title: "Role Assignments",
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
      <div>
        <h1 className="font-serif text-3xl font-bold">Role assignments</h1>
        <p className="mt-2 text-muted-foreground">
          View members in scope and assign chapter or organization roles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Members</CardTitle>
          <CardDescription>
            Portal accounts in your scope and their current roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members in scope yet.</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="rounded-lg border border-border p-4"
                >
                  <p className="font-medium text-foreground">{member.fullName}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {member.currentRoles.length ? (
                      member.currentRoles.map((role) => (
                        <Badge key={role} variant="secondary">
                          {ROLE_LABELS[role]}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">Guest (no roles)</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assign role</CardTitle>
          <CardDescription>
            Select a member, role, and chapter when required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssignRoleForm chapters={chapters} members={members} />
        </CardContent>
      </Card>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No role assignments in your scope yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold">All assignments</h2>
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">
                      {assignment.profiles?.full_name ?? "Member"}
                    </CardTitle>
                    <CardDescription>{assignment.email ?? "No email"}</CardDescription>
                  </div>
                  <Badge variant="outline">{assignment.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Role: {ROLE_LABELS[assignment.role]}</p>
                <p>
                  Chapter: {assignment.chapters?.name ?? "Organization-wide"}
                </p>
                <RemoveRoleButton userRoleId={assignment.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
