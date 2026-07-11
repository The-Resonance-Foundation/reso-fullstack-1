"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Users } from "lucide-react"
import { toast } from "sonner"
import {
  deleteTutor,
  deleteVolunteer,
  type MemberActionState,
} from "@/app/actions/member-management"
import { StatusBadge } from "@/components/portal/status-badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataTable } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import type { ChapterMember } from "@/lib/auth/dal"

type MemberType = "tutor" | "volunteer"

async function removeMember(memberType: MemberType, userRoleId: string, fullName: string) {
  const formData = new FormData()
  formData.set("userRoleId", userRoleId)
  const action = memberType === "tutor" ? deleteTutor : deleteVolunteer
  const result: MemberActionState = await action(undefined, formData)
  if (result?.success) {
    toast.success(result.message ?? `${fullName} removed.`)
  } else if (result?.message) {
    toast.error(result.message)
  }
}

function MemberRowActions({
  member,
  memberType,
}: {
  member: ChapterMember
  memberType: MemberType
}) {
  return (
    <div className="flex justify-end">
      <ConfirmDialog
        trigger={
          <Button
            size="sm"
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
          >
            Remove
          </Button>
        }
        title={`Remove ${memberType}`}
        description={`This deletes ${member.fullName}'s ${memberType} role, their linked application, and their portal account if they have no other roles. This cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={() => removeMember(memberType, member.userRoleId, member.fullName)}
      />
    </div>
  )
}

export function ChapterMembersTable({
  members,
  memberType,
}: {
  members: ChapterMember[]
  memberType: MemberType
}) {
  const columns = useMemo<ColumnDef<ChapterMember>[]>(
    () => [
      {
        id: "member",
        accessorFn: (row) => `${row.fullName} ${row.email}`,
        header: "Member",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{row.original.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.email || "No email on file"}
            </p>
          </div>
        ),
      },
      {
        id: "chapter",
        accessorFn: (row) => row.chapterName,
        header: "Chapter",
        cell: ({ row }) => row.original.chapterName,
      },
      {
        id: "status",
        accessorFn: (row) => row.status,
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <MemberRowActions member={row.original} memberType={memberType} />,
      },
    ],
    [memberType]
  )

  return (
    <DataTable
      columns={columns}
      data={members}
      searchPlaceholder={`Search ${memberType}s...`}
      pageSize={10}
      emptyState={
        <EmptyState
          icon={<Users aria-hidden />}
          title={`No ${memberType}s yet`}
          description={`${
            memberType === "tutor" ? "Tutors" : "Volunteers"
          } in your chapter will appear here once accepted from the applicant pipeline.`}
        />
      }
    />
  )
}
