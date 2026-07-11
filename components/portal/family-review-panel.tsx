"use client"

import { useMemo, useState } from "react"
import { HeartHandshake, Users } from "lucide-react"
import { StatusBadge } from "@/components/portal/status-badge"
import { StudentReviewActions } from "@/components/portal/student-review-actions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { cn, initials } from "@/lib/utils"
import type { FamilyForReviewer } from "@/lib/auth/dal"

type Filter = "all" | "pending"

export function FamilyReviewPanel({ families }: { families: FamilyForReviewer[] }) {
  const [filter, setFilter] = useState<Filter>("all")

  const pendingCount = useMemo(
    () =>
      families.reduce(
        (sum, family) =>
          sum + family.students.filter((student) => student.status === "pending").length,
        0
      ),
    [families]
  )

  const visibleFamilies = useMemo(() => {
    if (filter === "all") return families
    return families
      .map((family) => ({
        ...family,
        students: family.students.filter((student) => student.status === "pending"),
      }))
      .filter((family) => family.students.length > 0)
  }, [families, filter])

  if (families.length === 0) {
    return (
      <EmptyState
        icon={<HeartHandshake aria-hidden />}
        title="No registered parents yet"
        description="Parents will appear here once they sign up and are scoped to your chapter."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
            <span className="font-semibold text-foreground">{families.length}</span>{" "}
            <span className="text-muted-foreground">
              famil{families.length === 1 ? "y" : "ies"}
            </span>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
            <span className="font-semibold text-warning">{pendingCount}</span>{" "}
            <span className="text-muted-foreground">
              student{pendingCount === 1 ? "" : "s"} pending review
            </span>
          </div>
        </div>

        <div className="inline-flex items-center rounded-lg bg-muted p-1 text-muted-foreground">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setFilter("all")}
            className={cn(
              "h-8 rounded-md px-3",
              filter === "all" && "bg-background text-foreground shadow-sm"
            )}
          >
            All
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setFilter("pending")}
            className={cn(
              "h-8 rounded-md px-3",
              filter === "pending" && "bg-background text-foreground shadow-sm"
            )}
          >
            Pending only
          </Button>
        </div>
      </div>

      {visibleFamilies.length === 0 ? (
        <EmptyState
          icon={<Users aria-hidden />}
          title="No pending enrollments"
          description="Every student enrollment in your chapter has been reviewed."
        />
      ) : (
        <div className="space-y-4">
          {visibleFamilies.map((family) => (
            <Card key={family.parentUserId} className="animate-fade-up">
              <CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
                <Avatar>
                  <AvatarFallback>{initials(family.parentName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-serif text-lg font-semibold leading-tight">
                    {family.parentName}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {family.parentEmail}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {family.students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {filter === "pending"
                      ? "No pending students in this household."
                      : "No students added yet — waiting for parent to enroll students in the portal after email confirmation."}
                  </p>
                ) : (
                  family.students.map((student) => (
                    <div
                      key={student.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium text-foreground">
                          {student.first_name} {student.last_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{student.instrument ?? "No instrument set"}</span>
                          {student.skill_level ? (
                            <Badge variant="outline" className="capitalize">
                              {student.skill_level}
                            </Badge>
                          ) : null}
                          <span>
                            {student.chapters?.name ?? student.chapter_id}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={student.status} />
                        <StudentReviewActions
                          studentId={student.id}
                          status={student.status}
                          studentName={`${student.first_name} ${student.last_name}`}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
