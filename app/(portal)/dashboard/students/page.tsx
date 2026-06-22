import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AddStudentForm } from "@/components/portal/add-student-form"
import {
  getParentChapterOptions,
  getStudentsForParent,
  isParentAccount,
} from "@/lib/auth/dal"

function statusBadgeClass(status: string) {
  if (status === "pending") return "border-amber-500 text-amber-700"
  if (status === "rejected") return "border-destructive text-destructive"
  if (status === "active") return "border-primary text-primary"
  return undefined
}
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">My Students</h1>
        <p className="mt-2 text-muted-foreground">
          One parent login manages every student in your household. New students are
          submitted for chapter review before lessons begin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add a student</CardTitle>
          <CardDescription>
            Required policies are recorded when you add a student.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddStudentForm chapters={chapters} />
        </CardContent>
      </Card>

      {students.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No students linked yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {students.map((student) => (
            <Card key={student.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-lg">
                    {student.first_name} {student.last_name}
                  </CardTitle>
                  <Badge variant="outline" className={statusBadgeClass(student.status)}>
                    {student.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {student.chapters?.name ? (
                  <p>Chapter: {student.chapters.name}</p>
                ) : null}
                {student.instrument ? <p>Instrument: {student.instrument}</p> : null}
                {student.skill_level ? <p>Skill level: {student.skill_level}</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
