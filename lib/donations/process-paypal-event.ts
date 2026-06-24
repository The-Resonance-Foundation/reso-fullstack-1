import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import {
  formatDonationAuditSummary,
  type ParsedPaypalDonation,
} from "@/lib/paypal/parse-donation-event"

export type ProcessPaypalResult =
  | { ok: true; duplicate?: boolean }
  | { ok: false; error: string }

export async function processPaypalDonationEvent(
  parsed: ParsedPaypalDonation
): Promise<ProcessPaypalResult> {
  const admin = createAdminClient()

  const { data: existingEvent } = await admin
    .from("paypal_webhook_events")
    .select("paypal_event_id")
    .eq("paypal_event_id", parsed.eventId)
    .maybeSingle()

  if (existingEvent) {
    return { ok: true, duplicate: true }
  }

  const { error: stageError } = await admin.from("paypal_webhook_events").insert({
    paypal_event_id: parsed.eventId,
    event_type: parsed.eventType,
  })

  if (stageError) {
    if (stageError.code === "23505") {
      return { ok: true, duplicate: true }
    }
    return { ok: false, error: stageError.message }
  }

  if (parsed.eventType === "PAYMENT.CAPTURE.COMPLETED") {
    const { data: donation, error: insertError } = await admin
      .from("donations")
      .insert({
        chapter_id: null,
        amount: parsed.amount,
        currency: parsed.currency,
        net_amount: parsed.netAmount,
        fee_amount: parsed.feeAmount,
        status: parsed.status,
        source: "paypal_webhook",
        paypal_capture_id: parsed.captureId,
        paypal_event_id: parsed.eventId,
        payer_email: parsed.payerEmail,
        payer_name: parsed.payerName,
        donated_at: parsed.donatedAt,
        raw_payload: parsed.rawPayload,
      })
      .select("id")
      .maybeSingle()

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: existingDonation } = await admin
          .from("donations")
          .select("id")
          .eq("paypal_capture_id", parsed.captureId)
          .maybeSingle()

        if (existingDonation) {
          await admin
            .from("paypal_webhook_events")
            .update({ donation_id: existingDonation.id })
            .eq("paypal_event_id", parsed.eventId)
        }
        return { ok: true, duplicate: true }
      }
      return { ok: false, error: insertError.message }
    }

    const donationId = donation?.id ?? null

    await admin
      .from("paypal_webhook_events")
      .update({ donation_id: donationId })
      .eq("paypal_event_id", parsed.eventId)

    await admin.from("audit_logs").insert({
      actor_user_id: null,
      action: parsed.auditAction,
      entity_type: "donation",
      entity_id: donationId,
      chapter_id: null,
      summary: formatDonationAuditSummary(parsed),
      metadata: {
        paypal_capture_id: parsed.captureId,
        paypal_event_id: parsed.eventId,
      },
    })

    return { ok: true }
  }

  const { data: existingDonation } = await admin
    .from("donations")
    .select("id")
    .eq("paypal_capture_id", parsed.captureId)
    .maybeSingle()

  if (!existingDonation) {
    await admin.from("audit_logs").insert({
      actor_user_id: null,
      action: parsed.auditAction,
      entity_type: "donation",
      entity_id: null,
      chapter_id: null,
      summary: formatDonationAuditSummary(parsed),
      metadata: {
        paypal_capture_id: parsed.captureId,
        paypal_event_id: parsed.eventId,
        unmatched: true,
      },
    })

    await admin
      .from("paypal_webhook_events")
      .update({ donation_id: null })
      .eq("paypal_event_id", parsed.eventId)

    return { ok: true }
  }

  const { error: updateError } = await admin
    .from("donations")
    .update({ status: parsed.status })
    .eq("id", existingDonation.id)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  await admin
    .from("paypal_webhook_events")
    .update({ donation_id: existingDonation.id })
    .eq("paypal_event_id", parsed.eventId)

  await admin.from("audit_logs").insert({
    actor_user_id: null,
    action: parsed.auditAction,
    entity_type: "donation",
    entity_id: existingDonation.id,
    chapter_id: null,
    summary: formatDonationAuditSummary(parsed),
    metadata: {
      paypal_capture_id: parsed.captureId,
      paypal_event_id: parsed.eventId,
    },
  })

  return { ok: true }
}
