import { describe, expect, it } from "vitest"
import { canRsvpGoing, isValidApplicantStageTransition, isValidLessonStatusTransition, remainingEventCapacity } from "@/lib/events/helpers"
import { hasAvailabilityOverlap } from "@/lib/lessons/helpers"
import {
  availabilitySchema,
  eventSchema,
  practiceLogSchema,
  scheduleLessonSchema,
} from "@/lib/validations/phase23"

describe("availability overlap", () => {
  it("detects overlapping slots on same day", () => {
    const existing = [{ dayOfWeek: 1, startTime: "09:00", endTime: "11:00" }]
    expect(
      hasAvailabilityOverlap(existing, {
        dayOfWeek: 1,
        startTime: "10:00",
        endTime: "12:00",
      })
    ).toBe(true)
  })

  it("ignores different days", () => {
    const existing = [{ dayOfWeek: 1, startTime: "09:00", endTime: "11:00" }]
    expect(
      hasAvailabilityOverlap(existing, {
        dayOfWeek: 2,
        startTime: "10:00",
        endTime: "12:00",
      })
    ).toBe(false)
  })
})

describe("event capacity", () => {
  it("computes remaining spots", () => {
    expect(remainingEventCapacity(10, 7)).toBe(3)
    expect(remainingEventCapacity(null, 7)).toBeNull()
  })

  it("blocks RSVP when full", () => {
    expect(canRsvpGoing(5, 5)).toBe(false)
    expect(canRsvpGoing(5, 4)).toBe(true)
  })
})

describe("status transitions", () => {
  it("allows valid lesson transitions", () => {
    expect(isValidLessonStatusTransition("scheduled", "completed")).toBe(true)
    expect(isValidLessonStatusTransition("completed", "scheduled")).toBe(false)
  })

  it("allows applicant pipeline moves", () => {
    expect(isValidApplicantStageTransition("applied", "accepted")).toBe(true)
    expect(isValidApplicantStageTransition("applied", "rejected")).toBe(true)
    expect(isValidApplicantStageTransition("applied", "alumni")).toBe(false)
  })
})

describe("phase23 validation schemas", () => {
  it("validates availability", () => {
    const result = availabilitySchema.safeParse({
      chapterId: "f31ac17b-8f3c-4c1f-9ecb-ef5d3ccc87db",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:00",
    })
    expect(result.success).toBe(true)
  })

  it("validates lesson schedule", () => {
    const result = scheduleLessonSchema.safeParse({
      studentId: "f31ac17b-8f3c-4c1f-9ecb-ef5d3ccc87db",
      scheduledStart: "2026-06-22T10:00",
      scheduledEnd: "2026-06-22T11:00",
    })
    expect(result.success).toBe(true)
  })

  it("validates practice log", () => {
    const result = practiceLogSchema.safeParse({
      studentId: "f31ac17b-8f3c-4c1f-9ecb-ef5d3ccc87db",
      minutes: 30,
      practicedOn: "2026-06-22",
    })
    expect(result.success).toBe(true)
  })

  it("validates event", () => {
    const result = eventSchema.safeParse({
      title: "Spring recital",
      startsAt: "2026-06-22T18:00",
      endsAt: "2026-06-22T20:00",
      status: "published",
    })
    expect(result.success).toBe(true)
  })
})
