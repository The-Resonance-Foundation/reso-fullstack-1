import type { Metadata } from "next"
import { redirect } from "next/navigation"
import {
  AddAvailabilityDialog,
  WeeklyAvailabilityGrid,
} from "@/components/portal/availability-panel"
import { PageHeader } from "@/components/portal/page-header"
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
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Availability"
        description="Your weekly teaching windows. Officers and families use these to plan lessons."
        actions={<AddAvailabilityDialog chapters={tutorChapters} />}
      />

      <WeeklyAvailabilityGrid slots={slots} chapters={tutorChapters} />
    </div>
  )
}
