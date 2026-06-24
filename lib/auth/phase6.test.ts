import { describe, expect, it } from "vitest"
import {
  formatDonationAuditSummary,
  parsePaypalDonationEvent,
} from "@/lib/paypal/parse-donation-event"
import {
  canManageDonations,
  canViewAuditLogs,
  canViewDonations,
  canWriteAuditLogs,
} from "@/types/enums"
import {
  auditActionFromPaypalEvent,
  auditLogNoteSchema,
  donationStatusFromPaypalEvent,
  isPaypalDonationEventType,
  manualDonationSchema,
} from "@/lib/validations/phase6"

const completedFixture = {
  id: "WH-TEST-001",
  event_type: "PAYMENT.CAPTURE.COMPLETED",
  resource: {
    id: "CAPTURE-123",
    amount: { currency_code: "USD", value: "50.00" },
    create_time: "2026-06-01T12:00:00Z",
    update_time: "2026-06-01T12:00:01Z",
    payer: {
      email_address: "donor@example.com",
      name: { given_name: "Pat", surname: "Donor" },
    },
    seller_receivable_breakdown: {
      gross_amount: { currency_code: "USD", value: "50.00" },
      paypal_fee: { currency_code: "USD", value: "1.75" },
      net_amount: { currency_code: "USD", value: "48.25" },
    },
  },
}

describe("PayPal donation parser", () => {
  it("parses completed capture events", () => {
    const parsed = parsePaypalDonationEvent(completedFixture)
    expect(parsed).not.toBeNull()
    expect(parsed?.captureId).toBe("CAPTURE-123")
    expect(parsed?.amount).toBe(50)
    expect(parsed?.status).toBe("completed")
    expect(parsed?.payerName).toBe("Pat Donor")
  })

  it("formats audit summaries", () => {
    const parsed = parsePaypalDonationEvent(completedFixture)
    expect(parsed).not.toBeNull()
    if (!parsed) return
    expect(formatDonationAuditSummary(parsed)).toContain("$50.00")
  })

  it("recognizes supported event types", () => {
    expect(isPaypalDonationEventType("PAYMENT.CAPTURE.COMPLETED")).toBe(true)
    expect(isPaypalDonationEventType("BILLING.SUBSCRIPTION.CREATED")).toBe(false)
  })

  it("maps event types to statuses and audit actions", () => {
    expect(donationStatusFromPaypalEvent("PAYMENT.CAPTURE.REFUNDED")).toBe("refunded")
    expect(auditActionFromPaypalEvent("PAYMENT.CAPTURE.REVERSED")).toBe(
      "donation_reversed"
    )
  })
})

describe("phase6 permissions", () => {
  it("allows board and corp officer to manage donations", () => {
    expect(canManageDonations(["board_of_director"])).toBe(true)
    expect(canManageDonations(["corporate_officer"])).toBe(true)
    expect(canManageDonations(["program_administrator"])).toBe(false)
  })

  it("allows program admin to view donations but not chapter officers", () => {
    expect(canViewDonations(["program_administrator"])).toBe(true)
    expect(canViewDonations(["chapter_officer"])).toBe(false)
  })

  it("restricts audit logs to board and program admin", () => {
    expect(canViewAuditLogs(["program_administrator"])).toBe(true)
    expect(canViewAuditLogs(["corporate_officer"])).toBe(false)
    expect(canWriteAuditLogs(["board_of_director"])).toBe(true)
  })
})

describe("phase6 validation schemas", () => {
  it("validates manual donations", () => {
    const result = manualDonationSchema.safeParse({
      amount: 100,
      currency: "USD",
      donatedAt: "2026-06-01",
      payerName: "Anonymous",
    })
    expect(result.success).toBe(true)
  })

  it("validates audit notes", () => {
    const result = auditLogNoteSchema.safeParse({
      summary: "Reviewed donation records for Q2.",
    })
    expect(result.success).toBe(true)
  })

  it("rejects short audit notes", () => {
    const result = auditLogNoteSchema.safeParse({ summary: "ok" })
    expect(result.success).toBe(false)
  })
})
