import type { RsvpStatus } from "@/types/enums"

/** Count RSVPs that consume capacity (only "going"). */
export function countGoingRsvps(
  rsvps: Array<{ status: RsvpStatus }>
) {
  return rsvps.filter((row) => row.status === "going").length
}

export function remainingEventCapacity(
  capacity: number | null,
  goingCount: number
) {
  if (capacity === null) return null
  return Math.max(0, capacity - goingCount)
}

export function canRsvpGoing(
  capacity: number | null,
  goingCount: number
) {
  if (capacity === null) return true
  return goingCount < capacity
}

export function isValidLessonStatusTransition(
  from: string,
  to: string
) {
  if (from === to) return true
  if (from === "scheduled") {
    return ["completed", "cancelled", "no_show"].includes(to)
  }
  return false
}

const APPLICANT_STAGE_ORDER = [
  "interested",
  "applied",
  "accepted",
  "active",
  "alumni",
] as const

export function isValidApplicantStageTransition(from: string, to: string) {
  if (from === to) return true
  if (to === "rejected") return true
  const fromIndex = APPLICANT_STAGE_ORDER.indexOf(
    from as (typeof APPLICANT_STAGE_ORDER)[number]
  )
  const toIndex = APPLICANT_STAGE_ORDER.indexOf(
    to as (typeof APPLICANT_STAGE_ORDER)[number]
  )
  if (fromIndex === -1 || toIndex === -1) return false
  return toIndex === fromIndex + 1 || toIndex === fromIndex
}
