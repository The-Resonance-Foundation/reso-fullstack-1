"use server"

import { randomUUID } from "crypto"
import { canManageDonations, verifySession } from "@/lib/auth/dal"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidateAdminPaths } from "@/lib/portal/revalidate-admin"
import {
  manualDonationSchema,
  type ManualDonationFormState,
} from "@/lib/validations/phase6"

export async function recordManualDonation(
  _prev: ManualDonationFormState,
  formData: FormData
): Promise<ManualDonationFormState> {
  const validated = manualDonationSchema.safeParse({
    amount: formData.get("amount"),
    currency: formData.get("currency") || "USD",
    donatedAt: formData.get("donatedAt"),
    payerName: formData.get("payerName") || undefined,
    payerEmail: formData.get("payerEmail") || undefined,
    notes: formData.get("notes") || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const user = await verifySession()
  const allowed = await canManageDonations()
  if (!allowed) {
    return { message: "You are not authorized to record manual donations." }
  }

  const admin = createAdminClient()
  const captureId = `manual:${randomUUID()}`
  const donatedAt = new Date(validated.data.donatedAt).toISOString()

  const { data: donation, error } = await admin
    .from("donations")
    .insert({
      chapter_id: null,
      amount: validated.data.amount,
      currency: validated.data.currency.toUpperCase(),
      net_amount: validated.data.amount,
      status: "completed",
      source: "manual",
      paypal_capture_id: captureId,
      payer_email: validated.data.payerEmail || null,
      payer_name: validated.data.payerName || null,
      donated_at: donatedAt,
      notes: validated.data.notes ?? null,
      recorded_by: user.id,
    })
    .select("id")
    .single()

  if (error || !donation) {
    return { message: error?.message ?? "Could not record donation." }
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle()

  await admin.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "donation_manual",
    entity_type: "donation",
    entity_id: donation.id,
    chapter_id: null,
    summary: `Manual donation $${validated.data.amount.toFixed(2)} ${validated.data.currency.toUpperCase()} recorded by ${profile?.full_name ?? "staff"}`,
    metadata: {
      donation_id: donation.id,
      source: "manual",
    },
  })

  revalidateAdminPaths()
  return { success: true, message: "Manual donation recorded." }
}
