import "server-only"

import { cache } from "react"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifySession, getUserRoles } from "@/lib/auth/dal"
import type {
  Assignment,
  Event,
  EventAttendance,
  EventRsvp,
  Lesson,
  PracticeLog,
  Resource,
  Student,
  StudentTutorAssignment,
  TutorAvailability,
  LessonWithTutor,
} from "@/types/database"
import { isOrgAdmin, type RsvpStatus } from "@/types/enums"
import { canManageEvents } from "@/lib/auth/dal"

async function getScopedChapterIds() {
  const roles = await getUserRoles()
  const roleNames = roles.map((r) => r.role)
  if (isOrgAdmin(roleNames)) return null
  const chapterIds = roles
    .filter((r) =>
      ["chapter_officer", "chapter_president"].includes(r.role)
    )
    .map((r) => r.chapter_id)
    .filter(Boolean) as string[]
  return chapterIds
}

async function attachTutorNames(rows: Lesson[]): Promise<LessonWithTutor[]> {
  if (!rows.length) return []

  const tutorIds = [
    ...new Set(rows.map((row) => row.tutor_user_id).filter(Boolean) as string[]),
  ]
  if (!tutorIds.length) return rows

  const admin = createAdminClient()
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", tutorIds)

  const tutorById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.full_name])
  )

  return rows.map((row) => ({
    ...row,
    tutor: row.tutor_user_id
      ? { full_name: tutorById.get(row.tutor_user_id) ?? "Your tutor" }
      : null,
  }))
}

export type DateWindow = { from?: string; to?: string }

const DEFAULT_LESSON_WINDOW_MS = 90 * 24 * 60 * 60 * 1000
const DEFAULT_EVENT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

export const getLessonsForUser = cache(
  async (window?: DateWindow): Promise<LessonWithTutor[]> => {
    await verifySession()
    const supabase = await getServerClientOrThrow()

    const from = window?.from ?? new Date(Date.now() - DEFAULT_LESSON_WINDOW_MS).toISOString()

    let query = supabase
      .from("lessons")
      .select(
        "*, students(first_name, last_name, instrument), chapters(name, slug), lesson_logs(*)"
      )
      .gte("scheduled_start", from)
      .order("scheduled_start", { ascending: true })
      .limit(500)

    if (window?.to) {
      query = query.lte("scheduled_start", window.to)
    }

    const { data, error } = await query

    if (error) {
      console.error("getLessonsForUser", error.message)
      return []
    }

    return attachTutorNames((data ?? []) as Lesson[])
  }
)

export const getAssignedStudentsForTutor = cache(async (): Promise<Student[]> => {
  const user = await verifySession()
  const supabase = await getServerClientOrThrow()

  const { data: assignments, error: assignError } = await supabase
    .from("student_tutor_assignments")
    .select("student_id")
    .eq("tutor_user_id", user.id)
    .eq("status", "active")

  if (assignError || !assignments?.length) return []

  const studentIds = assignments.map((row) => row.student_id)
  const { data, error } = await supabase
    .from("students")
    .select("*, chapters(name, slug)")
    .in("id", studentIds)
    .eq("status", "active")
    .order("last_name")

  if (error) {
    console.error("getAssignedStudentsForTutor", error.message)
    return []
  }

  return (data ?? []) as Student[]
})

export const getAssignedStudentForTutor = cache(
  async (studentId: string): Promise<Student | null> => {
    const students = await getAssignedStudentsForTutor()
    return students.find((student) => student.id === studentId) ?? null
  }
)

export const getLessonsForStudent = cache(
  async (studentId: string): Promise<LessonWithTutor[]> => {
    await verifySession()
    const supabase = await getServerClientOrThrow()

    const { data, error } = await supabase
      .from("lessons")
      .select(
        "*, students(first_name, last_name, instrument), chapters(name, slug), lesson_logs(*)"
      )
      .eq("student_id", studentId)
      .order("scheduled_start", { ascending: true })
      .limit(200)

    if (error) {
      console.error("getLessonsForStudent", error.message)
      return []
    }

    return attachTutorNames((data ?? []) as Lesson[])
  }
)

export const getAssignmentsForStudent = cache(
  async (studentId: string): Promise<Assignment[]> => {
    await verifySession()
    const supabase = await getServerClientOrThrow()

    const { data, error } = await supabase
      .from("assignments")
      .select("*, students(first_name, last_name)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) {
      console.error("getAssignmentsForStudent", error.message)
      return []
    }

    return (data ?? []) as Assignment[]
  }
)

export const getStudentResourcesForTutor = cache(
  async (studentId: string): Promise<Resource[]> => {
    await verifySession()
    const supabase = await getServerClientOrThrow()

    const { data, error } = await supabase
      .from("resources")
      .select("*, chapters(name, slug), students(first_name, last_name)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("getStudentResourcesForTutor", error.message)
      return []
    }

    return (data ?? []) as Resource[]
  }
)

export const getPracticeLogsForStudent = cache(
  async (studentId: string): Promise<PracticeLog[]> => {
    await verifySession()
    const supabase = await getServerClientOrThrow()

    const { data, error } = await supabase
      .from("practice_logs")
      .select("*, students(first_name, last_name)")
      .eq("student_id", studentId)
      .order("practiced_on", { ascending: false })
      .limit(20)

    if (error) {
      console.error("getPracticeLogsForStudent", error.message)
      return []
    }

    return (data ?? []) as PracticeLog[]
  }
)

export const getTutorAvailability = cache(
  async (tutorUserId?: string): Promise<TutorAvailability[]> => {
    const user = await verifySession()
    const supabase = await getServerClientOrThrow()
    const targetId = tutorUserId ?? user.id

    const { data, error } = await supabase
      .from("tutor_availability")
      .select("*, chapters(name, slug)")
      .eq("tutor_user_id", targetId)
      .order("day_of_week")
      .order("start_time")

    if (error) {
      console.error("getTutorAvailability", error.message)
      return []
    }

    return (data ?? []) as TutorAvailability[]
  }
)

export const getPracticeLogsForParent = cache(async (): Promise<PracticeLog[]> => {
  await verifySession()
  const supabase = await getServerClientOrThrow()

  const { data, error } = await supabase
    .from("practice_logs")
    .select("*, students(first_name, last_name)")
    .order("practiced_on", { ascending: false })
    .limit(100)

  if (error) {
    console.error("getPracticeLogsForParent", error.message)
    return []
  }

  return (data ?? []) as PracticeLog[]
})

export const getAssignmentsForUser = cache(async (): Promise<Assignment[]> => {
  await verifySession()
  const supabase = await getServerClientOrThrow()

  const { data, error } = await supabase
    .from("assignments")
    .select("*, students(first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(300)

  if (error) {
    console.error("getAssignmentsForUser", error.message)
    return []
  }

  return (data ?? []) as Assignment[]
})

export const getResourcesForUser = cache(async (): Promise<Resource[]> => {
  await verifySession()
  const supabase = await getServerClientOrThrow()

  const { data, error } = await supabase
    .from("resources")
    .select("*, chapters(name, slug), students(first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(300)

  if (error) {
    console.error("getResourcesForUser", error.message)
    return []
  }

  return (data ?? []) as Resource[]
})

export const getChapterDocs = cache(async (): Promise<Resource[]> => {
  await verifySession()
  const supabase = await getServerClientOrThrow()
  const chapterIds = await getScopedChapterIds()

  let query = supabase
    .from("resources")
    .select("*, chapters(name, slug)")
    .is("student_id", null)
    .order("created_at", { ascending: false })

  if (chapterIds) {
    if (chapterIds.length === 0) return []
    query = query.in("chapter_id", chapterIds)
  }

  const { data, error } = await query
  if (error) {
    console.error("getChapterDocs", error.message)
    return []
  }

  return (data ?? []) as Resource[]
})

export const getTutorAssignmentsForReviewer = cache(
  async (): Promise<StudentTutorAssignment[]> => {
    await verifySession()
    const chapterIds = await getScopedChapterIds()
    if (chapterIds && chapterIds.length === 0) return []

    const admin = createAdminClient()
    let query = admin
      .from("student_tutor_assignments")
      .select("*, students(first_name, last_name, instrument), chapters(name)")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (chapterIds) {
      query = query.in("chapter_id", chapterIds)
    }

    const { data, error } = await query
    if (error) {
      console.error("getTutorAssignmentsForReviewer", error.message)
      return []
    }

    const rows = (data ?? []) as StudentTutorAssignment[]
    if (!rows.length) return []

    const tutorIds = [
      ...new Set(
        rows.map((row) => row.tutor_user_id).filter(Boolean) as string[]
      ),
    ]

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", tutorIds)

    const profileById = new Map(
      (profiles ?? []).map((profile) => [profile.id, profile.full_name])
    )

    return rows.map((row) => ({
      ...row,
      profiles: row.tutor_user_id
        ? { full_name: profileById.get(row.tutor_user_id) ?? "Tutor" }
        : null,
    }))
  }
)

export const getEventsForUser = cache(
  async (window?: DateWindow): Promise<Event[]> => {
    await verifySession()
    const supabase = await getServerClientOrThrow()

    const from = window?.from ?? new Date(Date.now() - DEFAULT_EVENT_WINDOW_MS).toISOString()

    let query = supabase
      .from("events")
      .select("*, chapters(name, slug)")
      .in("status", ["published", "completed"])
      .gte("starts_at", from)
      .order("starts_at", { ascending: true })
      .limit(300)

    if (window?.to) {
      query = query.lte("starts_at", window.to)
    }

    const { data, error } = await query

    if (error) {
      console.error("getEventsForUser", error.message)
      return []
    }

    return (data ?? []) as Event[]
  }
)

export const getEventsForManager = cache(async (): Promise<Event[]> => {
  await verifySession()
  const supabase = await getServerClientOrThrow()

  const from = new Date(Date.now() - DEFAULT_EVENT_WINDOW_MS).toISOString()

  const { data, error } = await supabase
    .from("events")
    .select("*, chapters(name, slug)")
    .gte("starts_at", from)
    .order("starts_at", { ascending: false })
    .limit(300)

  if (error) {
    console.error("getEventsForManager", error.message)
    return []
  }

  return (data ?? []) as Event[]
})

export type EventAttendee = {
  userId: string
  fullName: string
  rsvpStatus: RsvpStatus
  checkedInAt: string | null
}

export type EventWithMeta = Event & {
  rsvps: EventRsvp[]
  goingCount: number
  userRsvp: EventRsvp | null
  attendees: EventAttendee[]
}

export const getEventWithMeta = cache(
  async (eventId: string): Promise<EventWithMeta | null> => {
    const user = await verifySession()
    const supabase = await getServerClientOrThrow()

    const { data: event, error } = await supabase
      .from("events")
      .select("*, chapters(name, slug)")
      .eq("id", eventId)
      .maybeSingle()

    if (error || !event) return null

    const eventRecord = event as Event

    const [{ data: rsvps }, { data: attendanceRows }] = await Promise.all([
      supabase.from("event_rsvps").select("*").eq("event_id", eventId),
      supabase.from("event_attendance").select("*").eq("event_id", eventId),
    ])

    const allRsvps = (rsvps ?? []) as EventRsvp[]
    const attendance = (attendanceRows ?? []) as EventAttendance[]
    const attendanceByUser = new Map(
      attendance.map((row) => [row.user_id, row.checked_in_at])
    )
    const goingCount = allRsvps.filter((row) => row.status === "going").length
    const userRsvp = allRsvps.find((row) => row.user_id === user.id) ?? null

    let attendees: EventAttendee[] = []
    const canManage = await canManageEvents(eventRecord.chapter_id ?? undefined)

    if (canManage && allRsvps.length > 0) {
      const admin = createAdminClient()
      const userIds = [...new Set(allRsvps.map((row) => row.user_id))]
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds)

      const profileMap = new Map(
        (profiles ?? []).map((profile) => [profile.id, profile.full_name])
      )

      attendees = allRsvps.map((row) => ({
        userId: row.user_id,
        fullName: profileMap.get(row.user_id) ?? row.user_id,
        rsvpStatus: row.status,
        checkedInAt: attendanceByUser.get(row.user_id) ?? null,
      }))
    }

    return {
      ...eventRecord,
      rsvps: allRsvps,
      goingCount,
      userRsvp,
      attendees,
    }
  }
)

export type CalendarItem = {
  id: string
  title: string
  start: string
  end: string
  type: "lesson" | "event"
  chapterName?: string
}

export const getCalendarItems = cache(
  async (window?: DateWindow): Promise<CalendarItem[]> => {
    const [lessons, events] = await Promise.all([
      getLessonsForUser(window),
      getEventsForUser(window),
    ])

    const lessonItems: CalendarItem[] = lessons.map((lesson) => ({
      id: lesson.id,
      title: `Lesson: ${lesson.students?.first_name ?? "Student"} ${lesson.students?.last_name ?? ""}`.trim(),
      start: lesson.scheduled_start,
      end: lesson.scheduled_end,
      type: "lesson",
      chapterName: lesson.chapters?.name ?? undefined,
    }))

    const eventItems: CalendarItem[] = events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.starts_at,
      end: event.ends_at,
      type: "event",
      chapterName: event.chapters?.name ?? "Organization-wide",
    }))

    return [...lessonItems, ...eventItems].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    )
  }
)

export const getTutorsForAssignment = cache(async () => {
  await verifySession()
  const admin = createAdminClient()
  const chapterIds = await getScopedChapterIds()

  if (chapterIds && chapterIds.length === 0) return []

  let query = admin
    .from("user_roles")
    .select("user_id, chapter_id, chapters(name)")
    .eq("role", "tutor")
    .eq("status", "active")

  if (chapterIds) {
    query = query.in("chapter_id", chapterIds)
  }

  const { data: roleRows, error } = await query
  if (error) {
    console.error("getTutorsForAssignment", error.message)
    return []
  }
  if (!roleRows?.length) return []

  const userIds = roleRows.map((row) => row.user_id)
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds)

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.full_name])
  )

  return roleRows.map((row) => {
    const chapters = row.chapters as { name: string } | { name: string }[] | null
    return {
      user_id: row.user_id as string,
      chapter_id: row.chapter_id as string | null,
      profiles: {
        full_name: profileById.get(row.user_id) ?? "Tutor",
      },
      chapters: Array.isArray(chapters) ? chapters[0] ?? null : chapters,
    }
  })
})

export const getActiveStudentsForReviewer = cache(async (): Promise<Student[]> => {
  await verifySession()
  const supabase = await getServerClientOrThrow()
  const chapterIds = await getScopedChapterIds()

  let query = supabase
    .from("students")
    .select("*, chapters(name, slug)")
    .eq("status", "active")
    .order("last_name")

  if (chapterIds) {
    if (chapterIds.length === 0) return []
    query = query.in("chapter_id", chapterIds)
  }

  const { data, error } = await query
  if (error) {
    console.error("getActiveStudentsForReviewer", error.message)
    return []
  }

  return (data ?? []) as Student[]
})
