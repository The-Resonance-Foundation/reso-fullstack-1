import "server-only"

import { cache } from "react"
import { verifySession } from "@/lib/auth/dal"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import type { LessonRequest, Student, TutorAvailability } from "@/types/database"

async function attachNames(rows: LessonRequest[]): Promise<LessonRequest[]> {
  if (!rows.length) return rows
  const admin = createAdminClient()
  const ids = [
    ...new Set(rows.flatMap((r) => [r.tutor_user_id, r.parent_user_id])),
  ]
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", ids)
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]))
  return rows.map((r) => ({
    ...r,
    tutor_name: nameById.get(r.tutor_user_id) ?? "Tutor",
    parent_name: nameById.get(r.parent_user_id) ?? "Parent",
  }))
}

/** RLS returns only the caller's own requests (as parent). */
export const getLessonRequestsForParent = cache(async (): Promise<LessonRequest[]> => {
  const user = await verifySession()
  const supabase = await getServerClientOrThrow()
  const { data, error } = await supabase
    .from("lesson_requests")
    .select("*, students(first_name, last_name)")
    .eq("parent_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)
  if (error) {
    console.error("getLessonRequestsForParent", error.message)
    return []
  }
  return attachNames((data ?? []) as LessonRequest[])
})

/** RLS returns only requests addressed to the caller (as tutor). */
export const getLessonRequestsForTutor = cache(async (): Promise<LessonRequest[]> => {
  const user = await verifySession()
  const supabase = await getServerClientOrThrow()
  const { data, error } = await supabase
    .from("lesson_requests")
    .select("*, students(first_name, last_name)")
    .eq("tutor_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)
  if (error) {
    console.error("getLessonRequestsForTutor", error.message)
    return []
  }
  return attachNames((data ?? []) as LessonRequest[])
})

export type ParentRequestContext = {
  /** Active students that have at least one actively-assigned tutor. */
  students: (Pick<Student, "id" | "first_name" | "last_name" | "chapter_id"> & {
    tutors: { id: string; name: string; availability: TutorAvailability[] }[]
  })[]
}

/**
 * Assigned tutors + their weekly availability for the parent's students.
 * Availability is tutor-readable only under RLS, so the slots are fetched with
 * the admin client — scoped strictly to tutors assigned to this parent's
 * students.
 */
export const getParentRequestContext = cache(
  async (): Promise<ParentRequestContext> => {
    const user = await verifySession()
    const supabase = await getServerClientOrThrow()
    const { data: students } = await supabase
      .from("students")
      .select("id, first_name, last_name, chapter_id, status")
      .eq("parent_user_id", user.id)
      .eq("status", "active")
    if (!students?.length) return { students: [] }

    const admin = createAdminClient()
    const { data: assignments } = await admin
      .from("student_tutor_assignments")
      .select("student_id, tutor_user_id")
      .in("student_id", students.map((s) => s.id))
      .eq("status", "active")
    const tutorIds = [
      ...new Set((assignments ?? []).map((a) => a.tutor_user_id).filter(Boolean)),
    ] as string[]
    if (!tutorIds.length) return { students: [] }

    const [{ data: profiles }, { data: availability }] = await Promise.all([
      admin.from("profiles").select("id, full_name").in("id", tutorIds),
      admin
        .from("tutor_availability")
        .select("*")
        .in("tutor_user_id", tutorIds)
        .order("day_of_week")
        .order("start_time"),
    ])
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]))
    const slotsByTutor = new Map<string, TutorAvailability[]>()
    for (const slot of (availability ?? []) as TutorAvailability[]) {
      const list = slotsByTutor.get(slot.tutor_user_id) ?? []
      list.push(slot)
      slotsByTutor.set(slot.tutor_user_id, list)
    }

    return {
      students: students
        .map((s) => ({
          id: s.id,
          first_name: s.first_name,
          last_name: s.last_name,
          chapter_id: s.chapter_id,
          tutors: (assignments ?? [])
            .filter((a) => a.student_id === s.id && a.tutor_user_id)
            .map((a) => ({
              id: a.tutor_user_id as string,
              name: nameById.get(a.tutor_user_id as string) ?? "Tutor",
              availability: slotsByTutor.get(a.tutor_user_id as string) ?? [],
            })),
        }))
        .filter((s) => s.tutors.length > 0),
    }
  }
)
