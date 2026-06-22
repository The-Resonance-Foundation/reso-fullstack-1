import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StudentReviewActions } from "@/components/portal/student-review-actions"
import { canReviewApplicants, getFamiliesForReviewer } from "@/lib/auth/dal"

export const metadata: Metadata = {
  title: "Families",
  description: "Review parent households and student enrollments.",
}

function statusBadgeClass(status: string) {
  if (status === "pending") return "border-amber-500 text-amber-700"
  if (status === "rejected") return "border-destructive text-destructive"
  if (status === "active") return "border-primary text-primary"
  return undefined
}

export default async function AdminFamiliesPage() {
  const allowed = await canReviewApplicants()
  if (!allowed) redirect("/dashboard")

  const families = await getFamiliesForReviewer()

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Families</h1>
        <p className="mt-2 text-muted-foreground">
          Registered parents in your chapter and the students linked to each household.
          Parents appear here after signup; students appear once the parent adds them in
          the portal. Accept or reject pending student enrollments.
        </p>
      </div>

      {families.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No registered parents in your scope yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {families.map((family) => (
            <Card key={family.parentUserId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{family.parentName}</CardTitle>
                <CardDescription>{family.parentEmail}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {family.students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No students added yet — waiting for parent to enroll students in the
                    portal after email confirmation.
                  </p>
                ) : null}
                {family.students.map((student) => (
                  <div
                    key={student.id}
                    className="rounded-lg border border-border p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Chapter: {student.chapters?.name ?? student.chapter_id}
                        </p>
                      </div>
                      <Badge variant="outline" className={statusBadgeClass(student.status)}>
                        {student.status}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {student.instrument ? <p>Instrument: {student.instrument}</p> : null}
                      {student.skill_level ? (
                        <p>Skill level: {student.skill_level}</p>
                      ) : null}
                    </div>
                    <StudentReviewActions
                      studentId={student.id}
                      status={student.status}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
