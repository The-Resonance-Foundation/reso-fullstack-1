import { NextResponse } from "next/server"
import { processPaypalDonationEvent } from "@/lib/donations/process-paypal-event"
import { parsePaypalDonationEvent } from "@/lib/paypal/parse-donation-event"
import {
  extractPaypalWebhookHeaders,
  verifyPaypalWebhookSignature,
} from "@/lib/paypal/verify-webhook"
import { isPaypalDonationEventType } from "@/lib/validations/phase6"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const webhookHeaders = extractPaypalWebhookHeaders(request.headers)

  if (!webhookHeaders) {
    return NextResponse.json({ error: "Missing PayPal headers." }, { status: 400 })
  }

  const skipVerify = process.env.PAYPAL_SKIP_VERIFY === "true"
  if (!skipVerify) {
    const valid = await verifyPaypalWebhookSignature(rawBody, webhookHeaders)
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 })
    }
  }

  let event: unknown
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ received: true, skipped: "invalid_json" })
  }

  const eventType =
    typeof event === "object" &&
    event !== null &&
    "event_type" in event &&
    typeof (event as { event_type: unknown }).event_type === "string"
      ? (event as { event_type: string }).event_type
      : ""

  if (!isPaypalDonationEventType(eventType)) {
    return NextResponse.json({ received: true, skipped: eventType || "unknown" })
  }

  const parsed = parsePaypalDonationEvent(
    event as Parameters<typeof parsePaypalDonationEvent>[0]
  )
  if (!parsed) {
    console.error("Unparseable PayPal donation event", eventType)
    return NextResponse.json({ received: true, skipped: "unparseable" })
  }

  const result = await processPaypalDonationEvent(parsed)
  if (!result.ok) {
    console.error("PayPal donation processing failed", result.error)
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ received: true, duplicate: result.duplicate ?? false })
}
