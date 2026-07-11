"use client"

import { toast } from "sonner"
import { ShieldCheck, Trash2, Users } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { removeUserRole } from "@/app/actions/admin"
import { AssignRoleDialog } from "@/components/portal/role-assignment-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataTable } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PortalMember, RoleAssignmentRow } from "@/lib/auth/dal"
import type { Chapter } from "@/types/database"
import type { RoleStatus } from "@/types/enums"
import { ROLE_LABELS } from "@/types/roles"

const STATUS_BADGE_CLASSES: Record<RoleStatus, string> = {
  active: "bg-success/15 text-success border-transparent",
  pending: "bg-warning/15 text-warning border-transparent",
  inactive: "bg-destructive/15 text-destructive border-transparent",
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

function StatusBadge({ status }: { status: RoleStatus }) {
  return (
    <Badge className={STATUS_BADGE_CLASSES[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

function RemoveRoleAction({ assignment }: { assignment: RoleAssignmentRow }) {
  const memberName = assignment.profiles?.full_name ?? "this member"
  const scope = assignment.chapters?.name ?? "the organization"

  return (
    <ConfirmDialog
      trigger={
        <Button
          size="sm"
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Remove
        </Button>
      }
      title="Remove this role assignment?"
      description={`This immediately revokes ${ROLE_LABELS[assignment.role]} access for ${memberName} in ${scope}.`}
      confirmLabel="Remove"
      onConfirm={async () => {
        const formData = new FormData()
        formData.set("userRoleId", assignment.id)
        const result = await removeUserRole(undefined, formData)
        if (result?.success) {
          toast.success(result.message ?? "Role removed.")
        } else if (result?.message) {
          toast.error(result.message)
        }
      }}
    />
  )
}

function buildAssignmentColumns(): ColumnDef<RoleAssignmentRow>[] {
  return [
    {
      id: "member",
      header: "Member",
      accessorFn: (row) => `${row.profiles?.full_name ?? ""} ${row.email ?? ""}`,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {row.original.profiles?.full_name ?? "Member"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.email ?? "No email"}
          </p>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      accessorFn: (row) => ROLE_LABELS[row.role],
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <Badge variant="secondary">{ROLE_LABELS[row.original.role]}</Badge>
      ),
    },
    {
      id: "chapter",
      header: "Chapter",
      accessorFn: (row) => row.chapters?.name ?? "Organization",
      enableGlobalFilter: false,
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (row) => row.status,
      enableGlobalFilter: false,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "createdAt",
      header: "Assigned",
      accessorFn: (row) => row.created_at,
      enableGlobalFilter: false,
      cell: ({ row }) => DATE_FORMAT.format(new Date(row.original.created_at)),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <RemoveRoleAction assignment={row.original} />
        </div>
      ),
    },
  ]
}

function buildMemberColumns(): ColumnDef<PortalMember>[] {
  return [
    {
      id: "member",
      header: "Member",
      accessorFn: (row) => `${row.fullName} ${row.email}`,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{row.original.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.email || "No email"}
          </p>
        </div>
      ),
    },
    {
      id: "roles",
      header: "Current roles",
      accessorFn: (row) => row.currentRoles.map((role) => ROLE_LABELS[role]).join(", "),
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) =>
        row.original.currentRoles.length ? (
          <div className="flex flex-wrap gap-1.5">
            {row.original.currentRoles.map((role) => (
              <Badge key={role} variant="secondary">
                {ROLE_LABELS[role]}
              </Badge>
            ))}
          </div>
        ) : (
          <Badge variant="outline">Guest (no roles)</Badge>
        ),
    },
  ]
}

export function RoleAssignmentsTabs({
  assignments,
  chapters,
  members,
}: {
  assignments: RoleAssignmentRow[]
  chapters: Chapter[]
  members: PortalMember[]
}) {
  const assignmentColumns = buildAssignmentColumns()
  const memberColumns = buildMemberColumns()

  return (
    <Tabs defaultValue="assignments" className="animate-fade-up">
      <TabsList>
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
      </TabsList>

      <TabsContent value="assignments">
        <DataTable
          columns={assignmentColumns}
          data={assignments}
          searchPlaceholder="Search members..."
          pageSize={10}
          emptyState={
            <EmptyState
              icon={<ShieldCheck aria-hidden />}
              title="No role assignments yet"
              description="Assign a role to give a member access to chapter or organization tools."
              action={
                <AssignRoleDialog
                  chapters={chapters}
                  members={members}
                  trigger={<Button>Assign role</Button>}
                />
              }
            />
          }
        />
      </TabsContent>

      <TabsContent value="members">
        <DataTable
          columns={memberColumns}
          data={members}
          searchPlaceholder="Search members..."
          pageSize={10}
          emptyState={
            <EmptyState
              icon={<Users aria-hidden />}
              title="No members in scope yet"
              description="Members will appear here once they're granted a role."
            />
          }
        />
      </TabsContent>
    </Tabs>
  )
}
