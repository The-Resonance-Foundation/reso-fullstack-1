"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CheckCircle2, Inbox, ListChecks, XCircle } from "lucide-react"
import { ApplicantActions } from "@/components/portal/applicant-actions"
import { StatusBadge } from "@/components/portal/status-badge"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Applicant } from "@/types/database"
import { APPLICANT_STAGES, type ApplicantStage } from "@/types/enums"
import { ROLE_LABELS } from "@/types/roles"

const NEEDS_REVIEW_STAGES: ApplicantStage[] = ["interested", "applied"]
const REJECTED_STAGES: ApplicantStage[] = ["rejected"]
const ACTIVE_STAGES: ApplicantStage[] = APPLICANT_STAGES.filter(
  (stage) => !NEEDS_REVIEW_STAGES.includes(stage) && !REJECTED_STAGES.includes(stage)
)

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

export function ApplicantPipeline({ applicants }: { applicants: Applicant[] }) {
  const columns = useMemo<ColumnDef<Applicant>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => `${row.full_name} ${row.email}`,
        header: "Name",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{row.original.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        id: "type",
        accessorFn: (row) => row.type,
        header: "Type",
        cell: ({ row }) => (
          <div className="space-y-1">
            <Badge variant="outline" className="capitalize">
              {row.original.type}
            </Badge>
            {row.original.type === "officer" && row.original.requested_role ? (
              <p className="text-xs text-muted-foreground">
                {ROLE_LABELS[row.original.requested_role]}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "chapter",
        accessorFn: (row) => row.chapters?.name ?? row.chapter_id,
        header: "Chapter",
        cell: ({ row }) => row.original.chapters?.name ?? row.original.chapter_id,
      },
      {
        id: "stage",
        accessorFn: (row) => row.stage,
        header: "Stage",
        cell: ({ row }) => <StatusBadge status={row.original.stage} />,
      },
      {
        id: "applied",
        accessorFn: (row) => row.created_at,
        header: "Applied",
        cell: ({ row }) => DATE_FORMAT.format(new Date(row.original.created_at)),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ApplicantActions
            applicantId={row.original.id}
            fullName={row.original.full_name}
            stage={row.original.stage}
          />
        ),
      },
    ],
    []
  )

  const groups = useMemo(
    () => ({
      needsReview: applicants.filter((a) => NEEDS_REVIEW_STAGES.includes(a.stage)),
      active: applicants.filter((a) => ACTIVE_STAGES.includes(a.stage)),
      rejected: applicants.filter((a) => REJECTED_STAGES.includes(a.stage)),
      all: applicants,
    }),
    [applicants]
  )

  return (
    <Tabs defaultValue="needs-review" className="space-y-4">
      <TabsList>
        <TabsTrigger value="needs-review">Needs review ({groups.needsReview.length})</TabsTrigger>
        <TabsTrigger value="active">Active ({groups.active.length})</TabsTrigger>
        <TabsTrigger value="rejected">Rejected ({groups.rejected.length})</TabsTrigger>
        <TabsTrigger value="all">All ({groups.all.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="needs-review">
        <DataTable
          columns={columns}
          data={groups.needsReview}
          searchPlaceholder="Search applicants..."
          emptyState={
            <EmptyState
              icon={<Inbox aria-hidden />}
              title="Nothing to review"
              description="New tutor, officer, and volunteer applications will show up here."
            />
          }
        />
      </TabsContent>

      <TabsContent value="active">
        <DataTable
          columns={columns}
          data={groups.active}
          searchPlaceholder="Search applicants..."
          emptyState={
            <EmptyState
              icon={<CheckCircle2 aria-hidden />}
              title="No active staff yet"
              description="Accepted applicants will appear here once provisioned."
            />
          }
        />
      </TabsContent>

      <TabsContent value="rejected">
        <DataTable
          columns={columns}
          data={groups.rejected}
          searchPlaceholder="Search applicants..."
          emptyState={
            <EmptyState
              icon={<XCircle aria-hidden />}
              title="No rejected applications"
              description="Applications you reject will be listed here for your records."
            />
          }
        />
      </TabsContent>

      <TabsContent value="all">
        <DataTable
          columns={columns}
          data={groups.all}
          searchPlaceholder="Search applicants..."
          emptyState={
            <EmptyState
              icon={<ListChecks aria-hidden />}
              title="No applicants yet"
              description="Tutor, officer, and volunteer applications will show up here."
            />
          }
        />
      </TabsContent>
    </Tabs>
  )
}
