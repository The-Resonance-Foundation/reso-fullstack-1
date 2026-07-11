import "server-only"

import { cache } from "react"
import { getSession, getUserRoles } from "@/lib/auth/dal"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import { isOrgAdmin } from "@/types/enums"

/**
 * Role-aware dashboard stats. Counts use head+count queries (no row
 * transfer); trends use the RLS-respecting SQL RPCs from the hardening
 * migration. Everything is React-cache()d per request.
 */

function startOfDayISO(daysAgo: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

function inDaysISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

/** Chapter ids the caller manages, or null when org-wide (admin). */
const getReviewerChapterScope = cache(async (): Promise<string[] | null> => {
  const roles = await getUserRoles()
  const roleNames = roles.map((r) => r.role)
  if (isOrgAdmin(roleNames)) return null
  return roles
    .filter((r) => ["chapter_officer", "chapter_president"].includes(r.role))
    .map((r) => r.chapter_id)
    .filter(Boolean) as string[]
})

export type AdminDashboardStats = {
  activeStudents: number
  pendingStudents: number
  activeTutors: number
  activeVolunteers: number
  upcomingLessons7d: number
  pendingApplicants: number
  pendingVolunteerHours: number
  volunteerHoursThisMonth: number
}

export const getAdminDashboardStats = cache(async (): Promise<AdminDashboardStats> => {
  const user = await getSession()
  if (!user) throw new Error("Not authenticated")

  const supabase = await getServerClientOrThrow()
  const admin = createAdminClient()
  const chapterIds = await getReviewerChapterScope()

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  let activeStudentsQ = supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
  if (chapterIds) activeStudentsQ = activeStudentsQ.in("chapter_id", chapterIds)

  let pendingStudentsQ = supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
  if (chapterIds) pendingStudentsQ = pendingStudentsQ.in("chapter_id", chapterIds)

  // user_roles RLS hides other users' rows, so member counts go through the
  // admin client with the same JS chapter scoping the rest of the DAL uses.
  let activeTutorsQ = admin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "tutor")
    .eq("status", "active")
  if (chapterIds) activeTutorsQ = activeTutorsQ.in("chapter_id", chapterIds)

  let activeVolunteersQ = admin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "volunteer")
    .eq("status", "active")
  if (chapterIds) activeVolunteersQ = activeVolunteersQ.in("chapter_id", chapterIds)

  let upcomingLessonsQ = supabase
    .from("lessons")
    .select("*", { count: "exact", head: true })
    .eq("status", "scheduled")
    .gte("scheduled_start", new Date().toISOString())
    .lte("scheduled_start", inDaysISO(7))
  if (chapterIds) upcomingLessonsQ = upcomingLessonsQ.in("chapter_id", chapterIds)

  let pendingApplicantsQ = supabase
    .from("applicants")
    .select("*", { count: "exact", head: true })
    .in("stage", ["interested", "applied"])
  if (chapterIds) pendingApplicantsQ = pendingApplicantsQ.in("chapter_id", chapterIds)

  let pendingHoursQ = supabase
    .from("volunteer_hours")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
  if (chapterIds) pendingHoursQ = pendingHoursQ.in("chapter_id", chapterIds)

  let monthHoursQ = supabase
    .from("volunteer_hours")
    .select("hours")
    .eq("status", "approved")
    .gte("activity_date", monthStart.toISOString().slice(0, 10))
    .limit(1000)
  if (chapterIds) monthHoursQ = monthHoursQ.in("chapter_id", chapterIds)

  const [
    activeStudents,
    pendingStudents,
    activeTutors,
    activeVolunteers,
    upcomingLessons,
    pendingApplicants,
    pendingHours,
    monthHours,
  ] = await Promise.all([
    activeStudentsQ,
    pendingStudentsQ,
    activeTutorsQ,
    activeVolunteersQ,
    upcomingLessonsQ,
    pendingApplicantsQ,
    pendingHoursQ,
    monthHoursQ,
  ])

  return {
    activeStudents: activeStudents.count ?? 0,
    pendingStudents: pendingStudents.count ?? 0,
    activeTutors: activeTutors.count ?? 0,
    activeVolunteers: activeVolunteers.count ?? 0,
    upcomingLessons7d: upcomingLessons.count ?? 0,
    pendingApplicants: pendingApplicants.count ?? 0,
    pendingVolunteerHours: pendingHours.count ?? 0,
    volunteerHoursThisMonth: (monthHours.data ?? []).reduce(
      (sum, row) => sum + Number(row.hours ?? 0),
      0
    ),
  }
})

export type MonthlyDonationPoint = {
  month: string
  total: number
  count: number
}

export const getDonationSeries = cache(
  async (months = 12): Promise<MonthlyDonationPoint[]> => {
    const supabase = await getServerClientOrThrow()
    const { data, error } = await supabase.rpc("get_donation_monthly_totals", {
      month_count: months,
    })
    if (error) {
      console.error("getDonationSeries", error.message)
      return []
    }
    return (data ?? []).map(
      (row: { month: string; total: unknown; donation_count: unknown }) => ({
        month: row.month,
        total: Number(row.total ?? 0),
        count: Number(row.donation_count ?? 0),
      })
    )
  }
)

export type DonationTotals = {
  completedCount: number
  totalAmount: number
  last30DaysAmount: number
}

export const getDonationTotalsForDashboard = cache(
  async (): Promise<DonationTotals> => {
    const supabase = await getServerClientOrThrow()
    const { data, error } = await supabase.rpc("get_donation_totals")
    if (error) {
      console.error("getDonationTotalsForDashboard", error.message)
      return { completedCount: 0, totalAmount: 0, last30DaysAmount: 0 }
    }
    const row = Array.isArray(data) ? data[0] : data
    return {
      completedCount: Number(row?.completed_count ?? 0),
      totalAmount: Number(row?.total_amount ?? 0),
      last30DaysAmount: Number(row?.last_30_days_amount ?? 0),
    }
  }
)

export type WeeklyLessonPoint = {
  weekStart: string
  count: number
}

/** Completed + scheduled lessons per week for the last `weeks` weeks. */
export const getLessonsPerWeek = cache(
  async (weeks = 8): Promise<WeeklyLessonPoint[]> => {
    const supabase = await getServerClientOrThrow()
    const chapterIds = await getReviewerChapterScope()

    let query = supabase
      .from("lessons")
      .select("scheduled_start")
      .gte("scheduled_start", startOfDayISO(weeks * 7))
      .lte("scheduled_start", new Date().toISOString())
      .neq("status", "cancelled")
      .limit(2000)
    if (chapterIds) query = query.in("chapter_id", chapterIds)

    const { data, error } = await query
    if (error) {
      console.error("getLessonsPerWeek", error.message)
      return []
    }

    // Bucket by ISO week starting Monday.
    const buckets = new Map<string, number>()
    for (let i = weeks - 1; i >= 0; i--) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - d.getDay() - i * 7 + 1)
      buckets.set(d.toISOString().slice(0, 10), 0)
    }
    for (const row of data ?? []) {
      const d = new Date(row.scheduled_start)
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - d.getDay() + 1)
      const key = d.toISOString().slice(0, 10)
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
    }

    return [...buckets.entries()].map(([weekStart, count]) => ({ weekStart, count }))
  }
)

export type ActivityItem = {
  id: string
  summary: string
  action: string
  createdAt: string
  actorName: string | null
}

export const getRecentActivity = cache(async (): Promise<ActivityItem[]> => {
  const supabase = await getServerClientOrThrow()
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, summary, action, created_at, actor_user_id")
    .order("created_at", { ascending: false })
    .limit(8)

  if (error || !data?.length) return []

  const actorIds = [...new Set(data.map((r) => r.actor_user_id).filter(Boolean))]
  const admin = createAdminClient()
  const { data: profiles } = actorIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", actorIds)
    : { data: [] }
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]))

  return data.map((row) => ({
    id: row.id,
    summary: row.summary,
    action: row.action,
    createdAt: row.created_at,
    actorName: row.actor_user_id ? (nameById.get(row.actor_user_id) ?? null) : null,
  }))
})

export type ParentDashboardStats = {
  activeStudents: number
  pendingStudents: number
  upcomingLessons: number
  openAssignments: number
  practiceMinutesThisWeek: number
  practiceByDay: { day: string; minutes: number }[]
}

export const getParentDashboardStats = cache(
  async (): Promise<ParentDashboardStats> => {
    const user = await getSession()
    if (!user) throw new Error("Not authenticated")
    const supabase = await getServerClientOrThrow()

    const { data: students } = await supabase
      .from("students")
      .select("id, status")
      .eq("parent_user_id", user.id)

    const studentIds = (students ?? []).map((s) => s.id)

    const [lessons, assignments, practice] = await Promise.all([
      studentIds.length
        ? supabase
            .from("lessons")
            .select("*", { count: "exact", head: true })
            .in("student_id", studentIds)
            .eq("status", "scheduled")
            .gte("scheduled_start", new Date().toISOString())
        : Promise.resolve({ count: 0 }),
      studentIds.length
        ? supabase
            .from("assignments")
            .select("*", { count: "exact", head: true })
            .in("student_id", studentIds)
            .eq("status", "assigned")
        : Promise.resolve({ count: 0 }),
      studentIds.length
        ? supabase
            .from("practice_logs")
            .select("minutes, practiced_on")
            .in("student_id", studentIds)
            .gte("practiced_on", startOfDayISO(6).slice(0, 10))
            .limit(500)
        : Promise.resolve({ data: [] as { minutes: number; practiced_on: string }[] }),
    ])

    const byDay = new Map<string, number>()
    for (let i = 6; i >= 0; i--) {
      byDay.set(startOfDayISO(i).slice(0, 10), 0)
    }
    let weekTotal = 0
    for (const row of ("data" in practice ? practice.data : []) ?? []) {
      weekTotal += row.minutes
      if (byDay.has(row.practiced_on)) {
        byDay.set(row.practiced_on, (byDay.get(row.practiced_on) ?? 0) + row.minutes)
      }
    }

    return {
      activeStudents: (students ?? []).filter((s) => s.status === "active").length,
      pendingStudents: (students ?? []).filter((s) => s.status === "pending").length,
      upcomingLessons: lessons.count ?? 0,
      openAssignments: assignments.count ?? 0,
      practiceMinutesThisWeek: weekTotal,
      practiceByDay: [...byDay.entries()].map(([day, minutes]) => ({ day, minutes })),
    }
  }
)

export type TutorDashboardStats = {
  assignedStudents: number
  lessonsThisWeek: number
  hoursThisMonth: number
  openAssignments: number
}

export const getTutorDashboardStats = cache(
  async (): Promise<TutorDashboardStats> => {
    const user = await getSession()
    if (!user) throw new Error("Not authenticated")
    const supabase = await getServerClientOrThrow()

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const weekStart = new Date()
    weekStart.setHours(0, 0, 0, 0)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)

    const [students, lessons, hours, assignments] = await Promise.all([
      supabase
        .from("student_tutor_assignments")
        .select("*", { count: "exact", head: true })
        .eq("tutor_user_id", user.id)
        .eq("status", "active"),
      supabase
        .from("lessons")
        .select("*", { count: "exact", head: true })
        .eq("tutor_user_id", user.id)
        .neq("status", "cancelled")
        .gte("scheduled_start", weekStart.toISOString())
        .lte("scheduled_start", inDaysISO(7)),
      supabase
        .from("volunteer_hours")
        .select("hours")
        .eq("user_id", user.id)
        .gte("activity_date", monthStart.toISOString().slice(0, 10))
        .limit(500),
      supabase
        .from("assignments")
        .select("*", { count: "exact", head: true })
        .eq("tutor_user_id", user.id)
        .eq("status", "submitted"),
    ])

    return {
      assignedStudents: students.count ?? 0,
      lessonsThisWeek: lessons.count ?? 0,
      hoursThisMonth: (hours.data ?? []).reduce(
        (sum, row) => sum + Number(row.hours ?? 0),
        0
      ),
      openAssignments: assignments.count ?? 0,
    }
  }
)

export type VolunteerDashboardStats = {
  approvedHoursThisYear: number
  pendingHours: number
  certificates: number
}

export const getVolunteerDashboardStats = cache(
  async (): Promise<VolunteerDashboardStats> => {
    const user = await getSession()
    if (!user) throw new Error("Not authenticated")
    const supabase = await getServerClientOrThrow()

    const yearStart = new Date(new Date().getFullYear(), 0, 1)

    const [approved, pending, certs] = await Promise.all([
      supabase
        .from("volunteer_hours")
        .select("hours")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .gte("activity_date", yearStart.toISOString().slice(0, 10))
        .limit(1000),
      supabase
        .from("volunteer_hours")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending"),
      supabase
        .from("certificates")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ])

    return {
      approvedHoursThisYear: (approved.data ?? []).reduce(
        (sum, row) => sum + Number(row.hours ?? 0),
        0
      ),
      pendingHours: pending.count ?? 0,
      certificates: certs.count ?? 0,
    }
  }
)

export type UpcomingEvent = {
  id: string
  title: string
  startsAt: string
  location: string | null
}

export const getUpcomingEventsBrief = cache(
  async (limit = 3): Promise<UpcomingEvent[]> => {
    const supabase = await getServerClientOrThrow()
    const { data, error } = await supabase
      .from("events")
      .select("id, title, starts_at, location")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("getUpcomingEventsBrief", error.message)
      return []
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      startsAt: row.starts_at,
      location: row.location,
    }))
  }
)
