import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AvailabilityForm, AvailabilityList } from "@/components/portal/availability-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserRoles, isTutorAccount } from "@/lib/auth/dal"
import { getTutorAvailability } from "@/lib/data/phase23"

export const metadata: Metadata = {
  title: "Availability",
  description: "Manage your weekly tutoring availability.",
}

export default async function AvailabilityPage() {
  const isTutor = await isTutorAccount()
  if (!isTutor) redirect("/dashboard")

  const [roles, slots] = await Promise.all([getUserRoles(), getTutorAvailability()])
  const tutorChapters = roles
    .filter((r) => r.role === "tutor" && r.chapter_id)
    .map((r) => ({
      id: r.chapter_id!,
      name: r.chapters?.name ?? "Chapter",
      slug: r.chapters?.slug ?? "",
      city: null,
      state: null,
      status: "active" as const,
      created_at: "",
    }))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Availability</h1>
        <p className="mt-2 text-muted-foreground">
          Set the times you are available to teach each week.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add availability</CardTitle>
          <CardDescription>Officers and families can see your schedule.</CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityForm chapters={tutorChapters} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your slots</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityList slots={slots} />
        </CardContent>
      </Card>
    </div>
  )
}
