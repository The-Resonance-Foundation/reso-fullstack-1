"use server"

import { verifySession } from "@/lib/auth/dal"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { NotificationFormState } from "@/lib/validations/phase45"

export async function markNotificationRead(
  _prev: NotificationFormState,
  formData: FormData
): Promise<NotificationFormState> {
  const id = String(formData.get("id") ?? "")
  if (!id) return { message: "Missing notification id." }

  const user = await verifySession()
  const supabase = await getServerClientOrThrow()
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { message: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}

export async function markAllNotificationsRead(): Promise<NotificationFormState> {
  const user = await verifySession()
  const supabase = await getServerClientOrThrow()
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null)

  if (error) return { message: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}
