/** Pure helpers for availability overlap checks (unit-testable). */

export type TimeSlot = {
  dayOfWeek: number
  startTime: string
  endTime: string
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function timeSlotsOverlap(a: TimeSlot, b: TimeSlot) {
  if (a.dayOfWeek !== b.dayOfWeek) return false
  const aStart = toMinutes(a.startTime)
  const aEnd = toMinutes(a.endTime)
  const bStart = toMinutes(b.startTime)
  const bEnd = toMinutes(b.endTime)
  return aStart < bEnd && bStart < aEnd
}

export function hasAvailabilityOverlap(
  slots: TimeSlot[],
  candidate: TimeSlot,
  excludeIndex?: number
) {
  return slots.some((slot, index) => {
    if (excludeIndex !== undefined && index === excludeIndex) return false
    return timeSlotsOverlap(slot, candidate)
  })
}
