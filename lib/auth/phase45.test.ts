import { describe, expect, it } from "vitest"
import { sumVolunteerHours, volunteerHourDateRange } from "@/lib/volunteer/helpers"
import { messagePreview } from "@/lib/messaging/helpers"
import { canAuditMessageThreads } from "@/types/enums"
import {
  announcementSchema,
  isActivityDateValid,
  isValidVolunteerHourTransition,
  messageSchema,
  volunteerHourSchema,
} from "@/lib/validations/phase45"

describe("volunteer hour transitions", () => {
  it("allows pending to approved or rejected only", () => {
    expect(isValidVolunteerHourTransition("pending", "approved")).toBe(true)
    expect(isValidVolunteerHourTransition("pending", "rejected")).toBe(true)
    expect(isValidVolunteerHourTransition("approved", "pending")).toBe(false)
    expect(isValidVolunteerHourTransition("rejected", "approved")).toBe(false)
  })
})

describe("activity date validation", () => {
  it("rejects future dates", () => {
    const future = new Date()
    future.setDate(future.getDate() + 2)
    expect(isActivityDateValid(future.toISOString().slice(0, 10))).toBe(false)
  })

  it("accepts today", () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(isActivityDateValid(today)).toBe(true)
  })
})

describe("volunteer hour helpers", () => {
  it("sums hours", () => {
    expect(sumVolunteerHours([{ hours: 2 }, { hours: 1.5 }])).toBe(3.5)
  })

  it("computes date range", () => {
    expect(
      volunteerHourDateRange([
        { activity_date: "2026-06-01" },
        { activity_date: "2026-06-15" },
        { activity_date: "2026-06-10" },
      ])
    ).toEqual({ start: "2026-06-01", end: "2026-06-15" })
  })
})

describe("message audit permissions", () => {
  const chapterId = "chapter-a"

  it("allows board and program admin", () => {
    expect(
      canAuditMessageThreads(["board_of_director"], [null], chapterId)
    ).toBe(true)
    expect(
      canAuditMessageThreads(["program_administrator"], [null], chapterId)
    ).toBe(true)
  })

  it("allows chapter president for own chapter only", () => {
    expect(
      canAuditMessageThreads(
        ["chapter_president"],
        [chapterId],
        chapterId
      )
    ).toBe(true)
    expect(
      canAuditMessageThreads(
        ["chapter_president"],
        ["other-chapter"],
        chapterId
      )
    ).toBe(false)
  })

  it("denies chapter officers", () => {
    expect(
      canAuditMessageThreads(
        ["chapter_officer"],
        [chapterId],
        chapterId
      )
    ).toBe(false)
  })
})

describe("phase45 validation schemas", () => {
  const chapterId = "f31ac17b-8f3c-4c1f-9ecb-ef5d3ccc87db"

  it("validates volunteer hour submission", () => {
    const result = volunteerHourSchema.safeParse({
      chapterId,
      category: "teaching",
      hours: 2,
      activityDate: "2026-06-01",
      description: "Group lesson support",
    })
    expect(result.success).toBe(true)
  })

  it("rejects excessive hours", () => {
    const result = volunteerHourSchema.safeParse({
      chapterId,
      category: "event_support",
      hours: 25,
      activityDate: "2026-06-01",
    })
    expect(result.success).toBe(false)
  })

  it("validates messages", () => {
    const result = messageSchema.safeParse({
      conversationId: "f31ac17b-8f3c-4c1f-9ecb-ef5d3ccc87db",
      body: "Hello",
    })
    expect(result.success).toBe(true)
  })

  it("validates announcements", () => {
    const result = announcementSchema.safeParse({
      chapterId,
      title: "Recital reminder",
      body: "Dress rehearsal is Friday at 5pm.",
    })
    expect(result.success).toBe(true)
  })
})

describe("message preview", () => {
  it("truncates long bodies", () => {
    const long = "a".repeat(100)
    expect(messagePreview(long, 80).endsWith("…")).toBe(true)
  })
})
