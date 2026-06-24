import "server-only"

import { revalidatePath } from "next/cache"

export function revalidateTutorStudentPaths(studentId: string) {
  revalidatePath("/dashboard/tutor/students")
  revalidatePath(`/dashboard/tutor/students/${studentId}`)
  revalidatePath("/dashboard/lessons")
  revalidatePath("/dashboard/assignments")
  revalidatePath("/dashboard/resources")
  revalidatePath("/dashboard/calendar")
}
