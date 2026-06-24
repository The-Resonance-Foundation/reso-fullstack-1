import { z } from "zod"
import { AUDIT_ACTIONS, DONATION_SOURCES, DONATION_STATUSES } from "@/types/enums"

export type FormState =
  | { errors?: Record<string, string[] | undefined>; message?: string; success?: boolean }
  | undefined

export const manualDonationSchema = z.object({
  amount: z.coerce.number().gt(0).max(1_000_000),
  currency: z.string().trim().min(3).max(3).default("USD"),
  donatedAt: z.string().min(1),
  payerName: z.string().trim().optional(),
  payerEmail: z.string().trim().email().optional().or(z.literal("")),
  notes: z.string().trim().optional(),
})

export const auditLogNoteSchema = z.object({
  summary: z.string().trim().min(5).max(2000),
})

export const donationFilterSchema = z.object({
  status: z.enum(DONATION_STATUSES).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
})

export const auditLogFilterSchema = z.object({
  action: z.enum(AUDIT_ACTIONS).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
})

export type ManualDonationFormState = FormState
export type AuditLogNoteFormState = FormState

export const PAYPAL_DONATION_EVENT_TYPES = [
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.REFUNDED",
  "PAYMENT.CAPTURE.REVERSED",
] as const

export type PaypalDonationEventType = (typeof PAYPAL_DONATION_EVENT_TYPES)[number]

export function isPaypalDonationEventType(
  value: string
): value is PaypalDonationEventType {
  return (PAYPAL_DONATION_EVENT_TYPES as readonly string[]).includes(value)
}

export function donationStatusFromPaypalEvent(
  eventType: PaypalDonationEventType
): (typeof DONATION_STATUSES)[number] {
  switch (eventType) {
    case "PAYMENT.CAPTURE.COMPLETED":
      return "completed"
    case "PAYMENT.CAPTURE.REFUNDED":
      return "refunded"
    case "PAYMENT.CAPTURE.REVERSED":
      return "reversed"
  }
}

export function auditActionFromPaypalEvent(
  eventType: PaypalDonationEventType
): (typeof AUDIT_ACTIONS)[number] {
  switch (eventType) {
    case "PAYMENT.CAPTURE.COMPLETED":
      return "donation_received"
    case "PAYMENT.CAPTURE.REFUNDED":
      return "donation_refunded"
    case "PAYMENT.CAPTURE.REVERSED":
      return "donation_reversed"
  }
}

export function isManualDonationSource(source: string) {
  return (DONATION_SOURCES as readonly string[]).includes(source)
}
