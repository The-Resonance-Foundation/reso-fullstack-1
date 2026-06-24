import "server-only"

import { revalidatePath } from "next/cache"

export function revalidateVolunteerPaths() {
  revalidatePath("/dashboard/volunteer/hours")
  revalidatePath("/dashboard/volunteer/certificates")
  revalidatePath("/dashboard/admin/volunteer-hours")
}

export function revalidateVolunteerPathsForUser(userId: string) {
  revalidateVolunteerPaths()
  revalidatePath(`/dashboard/volunteer/hours`)
  void userId
}
