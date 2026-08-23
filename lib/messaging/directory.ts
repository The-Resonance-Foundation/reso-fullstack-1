import "server-only"

import { verifySession, getUserRoles } from "@/lib/auth/dal"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  ORG_ADMIN_ROLES,
  STAFF_MESSAGING_ROLES,
  type AppRole,
} from "@/types/enums"
import { ROLE_LABELS } from "@/types/roles"

export type MessageableUser = {
  id: string
  name: string
  roleLabel: string
  chapterName: string | null
}

/** Display precedence when a user holds several roles. */
const ROLE_PRECEDENCE: AppRole[] = [
  "board_of_director",
  "program_administrator",
  "corporate_officer",
  "chapter_president",
  "chapter_officer",
  "tutor",
  "volunteer",
  "student_parent",
]

type RoleRow = {
  user_id: string
  role: AppRole
  chapter_id: string | null
  chapters: { name: string } | null
}

/**
 * Child-safety messaging policy — who a user may START a conversation with:
 * - Parents: tutors actively assigned to one of their students, plus the
 *   officers/presidents of their chapter.
 * - Staff (tutor/officer/president/org admin/volunteer): any other staff
 *   member. Staff other than volunteers may also start conversations with
 *   parents — org-level roles with any parent, chapter roles with parents in
 *   their chapter.
 * Students are never messaged directly; parent<->parent is not allowed.
 */
async function computeAllowedTargets(userId: string): Promise<Set<string>> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("user_roles")
    .select("user_id, role, chapter_id, chapters(name)")
    .eq("status", "active")
  const rows = (data ?? []) as unknown as RoleRow[]

  const mine = rows.filter((r) => r.user_id === userId)
  if (!mine.length) return new Set()

  const allowed = new Set<string>()
  const myStaffRoles = mine.filter((r) => STAFF_MESSAGING_ROLES.includes(r.role))
  const myParentChapters = mine
    .filter((r) => r.role === "student_parent")
    .map((r) => r.chapter_id)

  // Parent rules
  if (myParentChapters.length) {
    const { data: students } = await admin
      .from("students")
      .select("id")
      .eq("parent_user_id", userId)
    const studentIds = (students ?? []).map((s) => s.id)
    if (studentIds.length) {
      const { data: assignments } = await admin
        .from("student_tutor_assignments")
        .select("tutor_user_id")
        .in("student_id", studentIds)
        .eq("status", "active")
      for (const a of assignments ?? []) {
        if (a.tutor_user_id) allowed.add(a.tutor_user_id)
      }
    }
    for (const r of rows) {
      if (
        (r.role === "chapter_officer" || r.role === "chapter_president") &&
        r.chapter_id !== null &&
        myParentChapters.includes(r.chapter_id)
      ) {
        allowed.add(r.user_id)
      }
    }
  }

  // Staff rules
  if (myStaffRoles.length) {
    for (const r of rows) {
      if (STAFF_MESSAGING_ROLES.includes(r.role)) allowed.add(r.user_id)
    }
    const nonVolunteerStaff = myStaffRoles.filter((r) => r.role !== "volunteer")
    if (nonVolunteerStaff.length) {
      const orgLevel = nonVolunteerStaff.some((r) =>
        ORG_ADMIN_ROLES.includes(r.role)
      )
      const myStaffChapters = nonVolunteerStaff
        .map((r) => r.chapter_id)
        .filter(Boolean) as string[]
      for (const r of rows) {
        if (r.role !== "student_parent") continue
        if (orgLevel || (r.chapter_id && myStaffChapters.includes(r.chapter_id))) {
          allowed.add(r.user_id)
        }
      }
    }
  }

  allowed.delete(userId)
  return allowed
}

export async function canDirectMessage(targetUserId: string): Promise<boolean> {
  const user = await verifySession()
  const allowed = await computeAllowedTargets(user.id)
  return allowed.has(targetUserId)
}

/** Recipient directory for the "New message" picker, sorted by name. */
export async function getMessageableUsers(): Promise<MessageableUser[]> {
  const user = await verifySession()
  await getUserRoles() // primes the role cache used elsewhere on the page
  const allowed = await computeAllowedTargets(user.id)
  if (!allowed.size) return []

  const admin = createAdminClient()
  const ids = [...allowed]
  const [{ data: profiles }, { data: roleRows }] = await Promise.all([
    admin.from("profiles").select("id, full_name").in("id", ids),
    admin
      .from("user_roles")
      .select("user_id, role, chapter_id, chapters(name)")
      .eq("status", "active")
      .in("user_id", ids),
  ])

  const rolesByUser = new Map<string, RoleRow[]>()
  for (const row of (roleRows ?? []) as unknown as RoleRow[]) {
    const list = rolesByUser.get(row.user_id) ?? []
    list.push(row)
    rolesByUser.set(row.user_id, list)
  }

  return (profiles ?? [])
    .map((p) => {
      const userRoles = rolesByUser.get(p.id) ?? []
      const primary =
        ROLE_PRECEDENCE.find((role) => userRoles.some((r) => r.role === role)) ??
        null
      const primaryRow = primary
        ? userRoles.find((r) => r.role === primary)
        : undefined
      return {
        id: p.id,
        name: p.full_name ?? "Member",
        roleLabel: primary ? ROLE_LABELS[primary] : "Member",
        chapterName: primaryRow?.chapters?.name ?? null,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}
