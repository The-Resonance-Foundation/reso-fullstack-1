export {
  isValidVolunteerHourTransition,
  isActivityDateValid,
} from "@/lib/validations/phase45"

export function sumVolunteerHours(hours: { hours: number }[]) {
  return hours.reduce((total, row) => total + Number(row.hours), 0)
}

export function volunteerHourDateRange(hours: { activity_date: string }[]) {
  if (!hours.length) return { start: null, end: null }
  const dates = hours.map((h) => h.activity_date).sort()
  return { start: dates[0], end: dates[dates.length - 1] }
}
