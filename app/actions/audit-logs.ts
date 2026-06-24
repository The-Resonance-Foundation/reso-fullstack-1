"use server"

import { canWriteAuditLogs, verifySession } from "@/lib/auth/dal"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import { revalidateAdminPaths } from "@/lib/portal/revalidate-admin"
import {
  auditLogNoteSchema,
  type AuditLogNoteFormState,
} from "@/lib/validations/phase6"

export async function createAuditLogNote(
  _prev: AuditLogNoteFormState,
  formData: FormData
): Promise<AuditLogNoteFormState> {
  const validated = auditLogNoteSchema.safeParse({
    summary: formData.get("summary"),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const allowed = await canWriteAuditLogs()
  if (!allowed) {
    return { message: "You are not authorized to write audit logs." }
  }

  const supabase = await getServerClientOrThrow()
  const { error } = await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "audit_note",
    entity_type: "audit_log",
    entity_id: null,
    chapter_id: null,
    summary: validated.data.summary,
    metadata: {},
  })

  if (error) {
    return { message: error.message }
  }

  revalidateAdminPaths()
  return { success: true, message: "Audit note added." }
}
