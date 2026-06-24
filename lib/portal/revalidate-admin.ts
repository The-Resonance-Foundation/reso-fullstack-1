import "server-only"

import { revalidatePath } from "next/cache"

export function revalidateAdminPaths() {
  revalidatePath("/dashboard/admin/donations")
  revalidatePath("/dashboard/admin/audit-logs")
  revalidatePath("/dashboard")
}
