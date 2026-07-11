import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { GraduationCap, Music } from "lucide-react"
import { AddStudentDialog } from "@/components/portal/add-student-form"
import { PageHeader } from "@/components/portal/page-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import {
  getParentChapterOptions,
  getStudentsForParent,
  isParentAccount,
} from "@/lib/auth/dal"
import { initials } from "@/lib/utils"
import type { StudentStatus } from "@/types/enums"

const STATUS_BADGE_CLASSES: Partial<Record<StudentStatus, string>> = {
  pending: "bg-warning/15 text-warning border-transparent",
  active: "bg-success/15 text-success border-transparent",
  rejected: "bg-destructive/15 text-destructive border-transparent",
  inactive: "bg-muted text-muted-foreground border-transparent",
  alumni: "bg-primary/15 text-primary border-transparent",
}

const ENROLLED_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

export const metadata: Metadata = {
  title: "My Students",
  description: "Manage students linked to your parent account.",
}

export default async function StudentsPage() {
  const isParent = await isParentAccount()
  if (!isParent) redirect("/dashboard")

  const [students, chapters] = await Promise.all([
    getStudentsForParent(),
    getParentChapterOptions(),
  ])

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="My students"
        description="One parent login manages every student in your household. New students are submitted for chapter review before lessons begin."
        actions={<AddStudentDialog chapters={chapters} />}
      />

      {students.length === 0 ? (
        <EmptyState
          icon={<GraduationCap aria-hidden />}
          title="No students yet"
          description="Add a student to request enrollment with your chapter — lessons can begin once they're approved."
          action={
            <AddStudentDialog
              chapters={chapters}
              trigger={<Button>Add your first student</Button>}
            />
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {students.map((student, index) => {
            const fullName = `${student.first_name} ${student.last_name}`.trim()
            return (
              <Card
                key={student.id}
                className="animate-fade-up"
                style={{ "--stagger-index": index } as React.CSSProperties}
              >
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{initials(fullName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{fullName}</p>
                        {student.instrument ? (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Music className="h-3 w-3 shrink-0" aria-hidden />
                            <span className="truncate">{student.instrument}</span>
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <Badge
                      className={
                        STATUS_BADGE_CLASSES[student.status] ??
                        "bg-muted text-muted-foreground border-transparent"
                      }
                    >
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {student.skill_level ? (
                      <Badge variant="secondary">
                        {student.skill_level.charAt(0).toUpperCase() +
                          student.skill_level.slice(1)}
                      </Badge>
                    ) : null}
                    {student.chapters?.name ? (
                      <Badge variant="outline">{student.chapters.name}</Badge>
                    ) : null}
                  </div>

                  {student.status === "pending" ? (
                    <p className="text-xs text-muted-foreground">
                      Awaiting chapter review — you&apos;ll be able to schedule
                      lessons once approved.
                    </p>
                  ) : null}
                  {student.status === "rejected" ? (
                    <p className="text-xs text-destructive">
                      This enrollment wasn&apos;t approved. Contact your chapter
                      for details or to re-apply.
                    </p>
                  ) : null}

                  <p className="text-xs text-muted-foreground">
                    Enrolled {ENROLLED_DATE.format(new Date(student.created_at))}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
