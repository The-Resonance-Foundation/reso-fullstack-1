import type { DonationStatus } from "@/types/enums"
import {
  auditActionFromPaypalEvent,
  donationStatusFromPaypalEvent,
  isPaypalDonationEventType,
  type PaypalDonationEventType,
} from "@/lib/validations/phase6"

export type ParsedPaypalDonation = {
  eventId: string
  eventType: PaypalDonationEventType
  captureId: string
  amount: number
  currency: string
  netAmount: number | null
  feeAmount: number | null
  payerEmail: string | null
  payerName: string | null
  donatedAt: string
  status: DonationStatus
  auditAction: ReturnType<typeof auditActionFromPaypalEvent>
  rawPayload: Record<string, unknown>
}

type Money = { currency_code?: string; value?: string }
type PayPalResource = {
  id?: string
  amount?: Money
  create_time?: string
  update_time?: string
  payer?: {
    email_address?: string
    name?: { given_name?: string; surname?: string }
  }
  seller_receivable_breakdown?: {
    net_amount?: Money
    paypal_fee?: Money
    gross_amount?: Money
  }
}

type PayPalWebhookEvent = {
  id?: string
  event_type?: string
  resource?: PayPalResource
}

function parseMoney(money?: Money) {
  if (!money?.value) return null
  const value = Number(money.value)
  return Number.isFinite(value) ? value : null
}

function buildPayerName(resource: PayPalResource) {
  const given = resource.payer?.name?.given_name ?? ""
  const surname = resource.payer?.name?.surname ?? ""
  const full = `${given} ${surname}`.trim()
  return full || null
}

export function parsePaypalDonationEvent(
  event: PayPalWebhookEvent
): ParsedPaypalDonation | null {
  const eventType = event.event_type ?? ""
  if (!isPaypalDonationEventType(eventType)) return null

  const eventId = event.id
  const captureId = event.resource?.id
  const amount = parseMoney(event.resource?.amount)

  if (!eventId || !captureId || amount === null || amount <= 0) return null

  const currency = event.resource?.amount?.currency_code ?? "USD"
  const netAmount =
    parseMoney(event.resource?.seller_receivable_breakdown?.net_amount) ??
    amount
  const feeAmount = parseMoney(
    event.resource?.seller_receivable_breakdown?.paypal_fee
  )
  const donatedAt =
    event.resource?.update_time ??
    event.resource?.create_time ??
    new Date().toISOString()

  return {
    eventId,
    eventType,
    captureId,
    amount,
    currency,
    netAmount,
    feeAmount,
    payerEmail: event.resource?.payer?.email_address ?? null,
    payerName: buildPayerName(event.resource ?? {}),
    donatedAt,
    status: donationStatusFromPaypalEvent(eventType),
    auditAction: auditActionFromPaypalEvent(eventType),
    rawPayload: (event.resource ?? {}) as Record<string, unknown>,
  }
}

export function formatDonationAuditSummary(parsed: ParsedPaypalDonation) {
  const amount = parsed.amount.toFixed(2)
  switch (parsed.eventType) {
    case "PAYMENT.CAPTURE.COMPLETED":
      return `PayPal donation $${amount} ${parsed.currency}`
    case "PAYMENT.CAPTURE.REFUNDED":
      return `PayPal refund on capture ${parsed.captureId} ($${amount} ${parsed.currency})`
    case "PAYMENT.CAPTURE.REVERSED":
      return `PayPal reversal on capture ${parsed.captureId} ($${amount} ${parsed.currency})`
  }
}
