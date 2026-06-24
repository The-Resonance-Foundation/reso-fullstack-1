"use server"

import {
  canApproveVolunteerHours,
  canLogVolunteerHours,
  verifySession,
} from "@/lib/auth/dal"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import { revalidateVolunteerPaths } from "@/lib/portal/revalidate-volunteer"
import { generateVolunteerCertificatePdf } from "@/lib/pdf/volunteer-certificate"
import {
  sumVolunteerHours,
  volunteerHourDateRange,
} from "@/lib/volunteer/helpers"
import {
  approveVolunteerHoursSchema,
  isActivityDateValid,
  isValidVolunteerHourTransition,
  rejectVolunteerHoursSchema,
  volunteerHourSchema,
  volunteerHourUpdateSchema,
  type VolunteerHourFormState,
} from "@/lib/validations/phase45"
import type { VolunteerHour } from "@/types/database"

async function issueCertificateForHours(
  hours: VolunteerHour[],
  approverId: string
) {
  if (!hours.length) return { error: "No hours to certify." }
  const admin = createAdminClient()
  const userId = hours[0].user_id
  const chapterId = hours[0].chapter_id
  const hourIds = hours.map((h) => h.id)

  const { data: existingCerts } = await admin
    .from("certificates")
    .select("id, source_hour_ids")
    .eq("user_id", userId)
    .eq("chapter_id", chapterId)

  const overlap = (existingCerts ?? []).find((cert) =>
    (cert.source_hour_ids ?? []).some((id: string) => hourIds.includes(id))
  )
  if (overlap) {
    return { certificateId: overlap.id }
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle()

  const { data: chapter } = await admin
    .from("chapters")
    .select("name")
    .eq("id", chapterId)
    .maybeSingle()

  const totalHours = sumVolunteerHours(hours)
  const { start, end } = volunteerHourDateRange(hours)
  if (!start || !end) return { error: "Invalid date range." }

  const { data: certificate, error: certError } = await admin
    .from("certificates")
    .insert({
      user_id: userId,
      chapter_id: chapterId,
      certificate_type: "volunteer_service",
      title: "Volunteer Service Certificate",
      total_hours: totalHours,
      period_start: start,
      period_end: end,
      issued_by: approverId,
      source_hour_ids: hourIds,
    })
    .select("id")
    .single()

  if (certError || !certificate) {
    return { error: certError?.message ?? "Certificate could not be created." }
  }

  const pdfBytes = await generateVolunteerCertificatePdf({
    volunteerName: profile?.full_name ?? "Volunteer",
    chapterName: chapter?.name ?? "Chapter",
    totalHours,
    periodStart: start,
    periodEnd: end,
    certificateId: certificate.id,
  })

  const storagePath = `${userId}/${certificate.id}.pdf`
  const { error: uploadError } = await admin.storage
    .from("certificates")
    .upload(storagePath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    })

  if (uploadError) {
    await admin.from("certificates").delete().eq("id", certificate.id)
    return { error: uploadError.message }
  }

  await admin
    .from("certificates")
    .update({ storage_path: storagePath })
    .eq("id", certificate.id)

  await admin.from("notifications").insert({
    user_id: userId,
    notification_type: "volunteer_approved",
    title: "Volunteer hours approved",
    body: `${totalHours.toFixed(2)} hours approved. Your certificate is ready.`,
    link_path: "/dashboard/volunteer/certificates",
  })

  return { certificateId: certificate.id }
}

export async function submitVolunteerHours(
  _prev: VolunteerHourFormState,
  formData: FormData
): Promise<VolunteerHourFormState> {
  const validated = volunteerHourSchema.safeParse({
    chapterId: formData.get("chapterId"),
    category: formData.get("category"),
    hours: formData.get("hours"),
    activityDate: formData.get("activityDate"),
    description: formData.get("description") || undefined,
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }
  if (!isActivityDateValid(validated.data.activityDate)) {
    return { message: "Activity date cannot be in the future." }
  }

  const user = await verifySession()
  const allowed = await canLogVolunteerHours(validated.data.chapterId)
  if (!allowed) {
    return { message: "You are not authorized to log hours for this chapter." }
  }

  const supabase = await getServerClientOrThrow()
  const { error } = await supabase.from("volunteer_hours").insert({
    user_id: user.id,
    chapter_id: validated.data.chapterId,
    category: validated.data.category,
    hours: validated.data.hours,
    activity_date: validated.data.activityDate,
    description: validated.data.description ?? null,
    status: "pending",
  })

  if (error) return { message: error.message }
  revalidateVolunteerPaths()
  return { success: true, message: "Volunteer hours submitted for approval." }
}

export async function updatePendingVolunteerHours(
  _prev: VolunteerHourFormState,
  formData: FormData
): Promise<VolunteerHourFormState> {
  const validated = volunteerHourUpdateSchema.safeParse({
    id: formData.get("id"),
    chapterId: formData.get("chapterId"),
    category: formData.get("category"),
    hours: formData.get("hours"),
    activityDate: formData.get("activityDate"),
    description: formData.get("description") || undefined,
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const supabase = await getServerClientOrThrow()
  const { data: row } = await supabase
    .from("volunteer_hours")
    .select("*")
    .eq("id", validated.data.id)
    .maybeSingle()

  if (!row || row.user_id !== user.id || row.status !== "pending") {
    return { message: "You can only edit your own pending entries." }
  }

  const { error } = await supabase
    .from("volunteer_hours")
    .update({
      category: validated.data.category,
      hours: validated.data.hours,
      activity_date: validated.data.activityDate,
      description: validated.data.description ?? null,
    })
    .eq("id", validated.data.id)

  if (error) return { message: error.message }
  revalidateVolunteerPaths()
  return { success: true, message: "Entry updated." }
}

export async function deletePendingVolunteerHours(
  _prev: VolunteerHourFormState,
  formData: FormData
): Promise<VolunteerHourFormState> {
  const id = String(formData.get("id") ?? "")
  if (!id) return { message: "Missing entry id." }

  const user = await verifySession()
  const supabase = await getServerClientOrThrow()
  const { error } = await supabase
    .from("volunteer_hours")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "pending")

  if (error) return { message: error.message }
  revalidateVolunteerPaths()
  return { success: true, message: "Entry removed." }
}

export async function approveVolunteerHours(
  _prev: VolunteerHourFormState,
  formData: FormData
): Promise<VolunteerHourFormState> {
  const hourIds = formData.getAll("hourIds").map(String).filter(Boolean)
  const validated = approveVolunteerHoursSchema.safeParse({ hourIds })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const supabase = await getServerClientOrThrow()
  const admin = createAdminClient()

  const { data: rows } = await supabase
    .from("volunteer_hours")
    .select("*")
    .in("id", validated.data.hourIds)

  if (!rows?.length) return { message: "No entries found." }

  const chapterId = rows[0].chapter_id
  const allowed = await canApproveVolunteerHours(chapterId)
  if (!allowed) return { message: "You are not authorized to approve these hours." }

  const sameUser = rows.every((r) => r.user_id === rows[0].user_id)
  const sameChapter = rows.every((r) => r.chapter_id === chapterId)
  if (!sameUser || !sameChapter) {
    return { message: "Approve one volunteer and chapter at a time." }
  }

  if (rows.some((r) => r.user_id === user.id)) {
    return { message: "You cannot approve your own hours." }
  }

  for (const row of rows) {
    if (!isValidVolunteerHourTransition(row.status, "approved")) {
      return { message: "One or more entries are no longer pending." }
    }
  }

  const now = new Date().toISOString()
  for (const row of rows) {
    const { error } = await admin
      .from("volunteer_hours")
      .update({
        status: "approved",
        approved_by: user.id,
        approved_at: now,
      })
      .eq("id", row.id)
      .eq("status", "pending")

    if (error) return { message: error.message }
  }

  const certResult = await issueCertificateForHours(
    rows as VolunteerHour[],
    user.id
  )
  if (certResult.error) return { message: certResult.error }

  revalidateVolunteerPaths()
  return { success: true, message: "Hours approved and certificate issued." }
}

export async function rejectVolunteerHours(
  _prev: VolunteerHourFormState,
  formData: FormData
): Promise<VolunteerHourFormState> {
  const validated = rejectVolunteerHoursSchema.safeParse({
    hourId: formData.get("hourId"),
    reason: formData.get("reason") || undefined,
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const supabase = await getServerClientOrThrow()
  const { data: row } = await supabase
    .from("volunteer_hours")
    .select("*")
    .eq("id", validated.data.hourId)
    .maybeSingle()

  if (!row) return { message: "Entry not found." }
  const allowed = await canApproveVolunteerHours(row.chapter_id)
  if (!allowed) return { message: "You are not authorized to reject this entry." }
  if (row.user_id === user.id) return { message: "You cannot reject your own hours." }
  if (!isValidVolunteerHourTransition(row.status, "rejected")) {
    return { message: "Entry is no longer pending." }
  }

  const { error } = await supabase
    .from("volunteer_hours")
    .update({
      status: "rejected",
      rejected_by: user.id,
      rejected_at: new Date().toISOString(),
      rejection_reason: validated.data.reason ?? null,
    })
    .eq("id", validated.data.hourId)

  if (error) return { message: error.message }
  revalidateVolunteerPaths()
  return { success: true, message: "Entry rejected." }
}
