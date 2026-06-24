import "server-only"
import { revalidatePath } from "next/cache"

export function revalidateMessagingPaths(conversationId?: string) {
  revalidatePath("/dashboard/messages")
  revalidatePath("/dashboard/messages/audit")
  revalidatePath("/dashboard/announcements")
  revalidatePath("/dashboard/admin/announcements")
  if (conversationId) revalidatePath(`/dashboard/messages/${conversationId}`)
}
