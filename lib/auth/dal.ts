import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"
import { createServerClient, getServerClientOrThrow } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Applicant, Chapter, Profile, Student, UserRole } from "@/types/database"
import {
  canManageChapter,
  canManageDonations as roleCanManageDonations,
  canViewAuditLogs as roleCanViewAuditLogs,
  canViewDonations as roleCanViewDonations,
  canWriteAuditLogs as roleCanWriteAuditLogs,
  isBoard,
  isCorporateOfficer,
  isOrgAdmin,
  type AppRole,
} from "@/types/enums"
import { ROLE_LABELS } from "@/types/roles"

export type SessionUser = {
  id: string
  email?: string
}

export type UserRoleWithChapter = UserRole & {
  chapters: Pick<Chapter, "name" | "slug"> | null
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createServerClient()
  if (!supabase) return null

  // getClaims verifies the access token's ES256 signature locally against the
  // project's cached JWKS, so identity costs no network round trip. It still
  // refreshes an expired session first, and forging a token is not possible
  // without the private key. Row access stays enforced by RLS regardless.
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!error && claims?.sub) {
    return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : undefined }
  }

  // Asymmetric keys unavailable or verification failed — fall back to asking
  // the auth server directly rather than letting anyone through.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return { id: user.id, email: user.email }
})

export const verifySession = cache(async (): Promise<SessionUser> => {
  const user = await getSession()
  if (!user) redirect("/login")
  return user
})

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSession()
  if (!user) return null

  const supabase = await getServerClientOrThrow()
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  return data
})

export const getUserRoles = cache(async (): Promise<UserRoleWithChapter[]> => {
  const user = await getSession()
  if (!user) return []

  const supabase = await getServerClientOrThrow()
  const { data } = await supabase
    .from("user_roles")
    .select("*, chapters(name, slug)")
    .eq("user_id", user.id)
    .eq("status", "active")

  return (data ?? []) as UserRoleWithChapter[]
})

export const getActiveRoleNames = cache(async (): Promise<AppRole[]> => {
  const roles = await getUserRoles()
  return roles.map((row) => row.role)
})

export function formatRoleList(roles: AppRole[]) {
  return roles.map((role) => ROLE_LABELS[role]).join(", ")
}

export const canReviewApplicants = cache(async (chapterId?: string | null) => {
  const roles = await getUserRoles()
  const roleNames = roles.map((r) => r.role)
  const chapterIds = roles.map((r) => r.chapter_id)

  if (isOrgAdmin(roleNames)) return true
  // Explicit null = a corporate-level application: org admins only.
  if (chapterId === null) return false
  if (!chapterId) {
    return roleNames.some((role) =>
      ["chapter_officer", "chapter_president"].includes(role)
    )
  }
  return canManageChapter(roleNames, chapterId, chapterIds)
})

export const getApplicantsForReviewer = cache(async (): Promise<Applicant[]> => {
  await verifySession()
  const supabase = await getServerClientOrThrow()
  const roles = await getUserRoles()
  const roleNames = roles.map((r) => r.role)
  const isAdmin = isOrgAdmin(roleNames)

  let query = supabase
    .from("applicants")
    .select("*, chapters(name, slug)")
    .in("type", ["tutor", "officer", "volunteer"])
    .order("created_at", { ascending: false })

  if (!isAdmin) {
    const chapterIds = roles
      .filter((r) =>
        ["chapter_officer", "chapter_president"].includes(r.role)
      )
      .map((r) => r.chapter_id)
      .filter(Boolean) as string[]

    if (chapterIds.length === 0) return []
    query = query.in("chapter_id", chapterIds)
  }

  const { data, error } = await query
  if (error) {
    console.error("getApplicantsForReviewer", error.message)
    return []
  }

  return (data ?? []) as Applicant[]
})

export type ChapterMember = {
  userRoleId: string
  userId: string
  chapterId: string | null
  chapterName: string
  fullName: string
  email: string
  status: UserRole["status"]
  applicantId: string | null
}

async function getMembersByRole(role: AppRole): Promise<ChapterMember[]> {
  await verifySession()
  const roles = await getUserRoles()
  const roleNames = roles.map((r) => r.role)
  const isAdmin = isOrgAdmin(roleNames)

  const chapterIds = isAdmin
    ? null
    : (roles
        .filter((r) =>
          ["chapter_officer", "chapter_president"].includes(r.role)
        )
        .map((r) => r.chapter_id)
        .filter(Boolean) as string[])

  if (!isAdmin && chapterIds?.length === 0) return []

  const admin = createAdminClient()

  let query = admin
    .from("user_roles")
    .select("id, user_id, chapter_id, status, chapters(name)")
    .eq("role", role)
    .order("created_at", { ascending: false })

  if (chapterIds) {
    query = query.in("chapter_id", chapterIds)
  }

  const { data: roleRows, error } = await query
  if (error || !roleRows?.length) {
    if (error) console.error(`getMembersByRole(${role})`, error.message)
    return []
  }

  const userIds = roleRows.map((row) => row.user_id)
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds)

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  )

  const applicantType =
    role === "tutor" ? "tutor" : role === "volunteer" ? "volunteer" : null

  const { data: applicants } = applicantType
    ? await admin
        .from("applicants")
        .select("id, converted_user_id, email, full_name, chapter_id")
        .eq("type", applicantType)
        .in("converted_user_id", userIds)
    : { data: [] }

  const applicantByUserChapter = new Map(
    (applicants ?? []).map((applicant) => [
      `${applicant.converted_user_id}:${applicant.chapter_id}`,
      applicant,
    ])
  )

  const members: ChapterMember[] = []

  for (const row of roleRows) {
    const applicant =
      row.chapter_id != null
        ? (applicantByUserChapter.get(`${row.user_id}:${row.chapter_id}`) ?? null)
        : null

    const profile = profileById.get(row.user_id)
    const email = applicant?.email ?? profile?.email ?? ""
    const fullName = applicant?.full_name ?? profile?.full_name ?? role

    const chapter = row.chapters as { name: string } | { name: string }[] | null
    const chapterName = Array.isArray(chapter)
      ? chapter[0]?.name
      : chapter?.name

    members.push({
      userRoleId: row.id,
      userId: row.user_id,
      chapterId: row.chapter_id,
      chapterName: chapterName ?? row.chapter_id ?? "Organization",
      fullName,
      email,
      status: row.status,
      applicantId: applicant?.id ?? null,
    })
  }

  return members
}

export type TutorMember = ChapterMember

export const getTutorsForReviewer = cache(() => getMembersByRole("tutor"))

export const getVolunteersForReviewer = cache(() => getMembersByRole("volunteer"))

export const getStudentsForParent = cache(async (): Promise<Student[]> => {
  const user = await getSession()
  if (!user) return []

  const supabase = await getServerClientOrThrow()
  const { data, error } = await supabase
    .from("students")
    .select("*, chapters(name, slug)")
    .eq("parent_user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("getStudentsForParent", error.message)
    return []
  }

  return data ?? []
})

export const isParentAccount = cache(async () => {
  const roles = await getActiveRoleNames()
  return roles.includes("student_parent")
})

export const isTutorAccount = cache(async () => {
  const roles = await getActiveRoleNames()
  return roles.includes("tutor")
})

export const isVolunteerAccount = cache(async () => {
  const roles = await getActiveRoleNames()
  return roles.includes("volunteer")
})

export const getVolunteerChapterOptions = cache(async () => {
  const roles = await getUserRoles()
  const seen = new Set<string>()
  const options = roles
    .filter((r) => ["tutor", "volunteer"].includes(r.role) && r.chapter_id)
    .flatMap((r) => {
      if (!r.chapter_id || seen.has(r.chapter_id)) return []
      seen.add(r.chapter_id)
      return [{ id: r.chapter_id, name: r.chapters?.name ?? "Chapter" }]
    })
  // Corporate-level volunteers (org-wide role, no chapter) log hours at the
  // corporate level — "org" is the sentinel value the submit action maps to a
  // null chapter.
  const hasChapterlessRole = roles.some((r) => r.chapter_id === null)
  if (hasChapterlessRole) {
    options.push({ id: "org", name: "Corporate (organization-wide)" })
  }
  return options
})

/**
 * Logging hours: pass a chapter id for chapter hours, explicit null for
 * corporate-level hours (requires an org-level tutor/volunteer role), or
 * nothing for the generic "can log at all" UI check.
 */
export const canLogVolunteerHours = cache(async (chapterId?: string | null) => {
  const roles = await getUserRoles()
  const roleNames = roles.map((r) => r.role)
  if (chapterId === null) {
    // Corporate hours: any member whose role is org-level (chapterless) —
    // corporate volunteers, corporate officers, program admins, board.
    return roles.some((r) => r.chapter_id === null)
  }
  if (isOrgAdmin(roleNames)) return true
  if (!chapterId) {
    return roleNames.some((role) => ["tutor", "volunteer"].includes(role))
  }
  return roles.some(
    (r) =>
      ["tutor", "volunteer"].includes(r.role) && r.chapter_id === chapterId
  )
})

/**
 * Volunteer-hour approvals: the board approves everything, including
 * corporate-level hours (explicit null chapter). Program administrators and
 * chapter presidents approve chapter-level hours (presidents only their own
 * chapter). Chapter officers do not approve hours.
 */
export const canApproveVolunteerHours = cache(
  async (chapterId?: string | null) => {
    const roles = await getUserRoles()
    const roleNames = roles.map((r) => r.role)
    if (isBoard(roleNames)) return true
    if (chapterId === null) return false // corporate hours: board only
    if (roleNames.includes("program_administrator")) return true
    if (!chapterId) {
      return roleNames.includes("chapter_president")
    }
    return roles.some(
      (r) => r.role === "chapter_president" && r.chapter_id === chapterId
    )
  }
)

export const canAuditMessages = cache(async (chapterId?: string) => {
  const roles = await getUserRoles()
  const roleNames = roles.map((r) => r.role)
  if (roleNames.includes("board_of_director")) return true
  if (roleNames.includes("program_administrator")) return true
  if (!chapterId) {
    return roleNames.includes("chapter_president")
  }
  return roles.some(
    (r) => r.role === "chapter_president" && r.chapter_id === chapterId
  )
})

export const canViewDonations = cache(async () => {
  const roleNames = await getActiveRoleNames()
  return roleCanViewDonations(roleNames)
})

export const canManageDonations = cache(async () => {
  const roleNames = await getActiveRoleNames()
  return roleCanManageDonations(roleNames)
})

export const canViewAuditLogs = cache(async () => {
  const roleNames = await getActiveRoleNames()
  return roleCanViewAuditLogs(roleNames)
})

export const canWriteAuditLogs = cache(async () => {
  const roleNames = await getActiveRoleNames()
  return roleCanWriteAuditLogs(roleNames)
})

export const canManageLessons = cache(async (chapterId?: string) => {
  const roles = await getUserRoles()
  const roleNames = roles.map((r) => r.role)
  const chapterIds = roles.map((r) => r.chapter_id)

  if (isOrgAdmin(roleNames)) return true
  if (roleNames.includes("tutor")) {
    if (!chapterId) return true
    return roles.some(
      (r) => r.role === "tutor" && r.chapter_id === chapterId
    )
  }
  if (!chapterId) {
    return roleNames.some((role) =>
      ["chapter_officer", "chapter_president"].includes(role)
    )
  }
  return canManageChapter(roleNames, chapterId, chapterIds)
})

export const canManageEvents = cache(async (chapterId?: string) => {
  const roles = await getUserRoles()
  const roleNames = roles.map((r) => r.role)
  const chapterIds = roles.map((r) => r.chapter_id)

  // No chapter = an organization-wide (corporate-level) event. Board, program
  // administrators, and corporate officers own those.
  if (!chapterId) {
    return isOrgAdmin(roleNames) || isCorporateOfficer(roleNames)
  }
  return canManageChapter(roleNames, chapterId, chapterIds)
})

/** Whether the member can manage events at any scope (UI gating only). */
export const canManageAnyEvents = cache(async () => {
  const roleNames = await getActiveRoleNames()
  return (
    isOrgAdmin(roleNames) ||
    isCorporateOfficer(roleNames) ||
    roleNames.some((role) => ["chapter_officer", "chapter_president"].includes(role))
  )
})

export const canAccessPortalFeatures = cache(async () => {
  const roleNames = await getActiveRoleNames()
  return roleNames.length > 0
})

export const canManageChapters = cache(async () => {
  const roles = await getActiveRoleNames()
  return isBoard(roles)
})

/**
 * Assignment rules:
 * - Board: any role.
 * - Program administrators: anything except chapter_president,
 *   corporate_officer, and board_of_director (all board-only appointments).
 * - Chapter presidents/officers: chapter-scoped roles in their own chapter,
 *   except chapter_president (board-only).
 */
export const canAssignRole = cache(
  async (role: AppRole, chapterId?: string | null) => {
    const roles = await getUserRoles()
    const roleNames = roles.map((r) => r.role)
    if (isBoard(roleNames)) return true
    if (
      ["chapter_president", "corporate_officer", "board_of_director"].includes(role)
    ) {
      return false
    }
    if (roleNames.includes("program_administrator")) return true
    if (!chapterId) return false
    const chapterIds = roles.map((r) => r.chapter_id)
    return canManageChapter(roleNames, chapterId, chapterIds)
  }
)

/**
 * Removal rules: no officer (chapter officer, chapter president, corporate
 * officer, board member) can be removed except by the board. Tutors,
 * volunteers, and parent roles follow the assignment scoping — chapter
 * leadership can still manage and remove tutors in their chapter.
 */
export const canRemoveRole = cache(
  async (role: AppRole, chapterId?: string | null) => {
    const roles = await getUserRoles()
    const roleNames = roles.map((r) => r.role)
    if (isBoard(roleNames)) return true
    if (
      ["chapter_officer", "chapter_president", "corporate_officer", "board_of_director"].includes(
        role
      )
    ) {
      return false
    }
    if (roleNames.includes("program_administrator")) return true
    if (!chapterId) return false
    const chapterIds = roles.map((r) => r.chapter_id)
    return canManageChapter(roleNames, chapterId, chapterIds)
  }
)

export const canAssignRoles = cache(async () => {
  const roles = await getUserRoles()
  const roleNames = roles.map((r) => r.role)
  if (isBoard(roleNames)) return true
  return roleNames.some((role) =>
    ["program_administrator", "chapter_officer", "chapter_president"].includes(role)
  )
})

export const getAllChapters = cache(async (): Promise<Chapter[]> => {
  await verifySession()
  const supabase = await getServerClientOrThrow()
  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .order("name")

  if (error) {
    console.error("getAllChapters", error.message)
    return []
  }

  return data ?? []
})

export type RoleAssignmentRow = Omit<UserRole, "chapters"> & {
  profiles: Pick<Profile, "full_name"> | null
  chapters: Pick<Chapter, "name"> | null
  email?: string
}

export const getRoleAssignments = cache(async (): Promise<RoleAssignmentRow[]> => {
  await verifySession()
  const roles = await getUserRoles()
  const roleNames = roles.map((r) => r.role)

  const supabase = await getServerClientOrThrow()

  let query = supabase
    .from("user_roles")
    .select("*, chapters(name)")
    .order("created_at", { ascending: false })

  if (!isBoard(roleNames)) {
    const chapterIds = roles
      .filter((r) =>
        ["chapter_officer", "chapter_president"].includes(r.role)
      )
      .map((r) => r.chapter_id)
      .filter(Boolean) as string[]

    if (chapterIds.length === 0) return []
    query = query.in("chapter_id", chapterIds)
  }

  const { data, error } = await query
  if (error) {
    console.error("getRoleAssignments", error.message)
    return []
  }

  const roleRows = (data ?? []) as (UserRole & {
    chapters: Pick<Chapter, "name"> | Pick<Chapter, "name">[] | null
  })[]

  if (roleRows.length === 0) return []

  const admin = createAdminClient()
  const userIds = roleRows.map((row) => row.user_id)

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds)

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  )

  return roleRows.map((row) => {
    const chapter = row.chapters
    const chapterName = Array.isArray(chapter) ? chapter[0] : chapter
    const profile = profileById.get(row.user_id)

    return {
      id: row.id,
      user_id: row.user_id,
      chapter_id: row.chapter_id,
      role: row.role,
      status: row.status,
      created_at: row.created_at,
      chapters: chapterName ? { name: chapterName.name } : null,
      profiles: profile?.full_name ? { full_name: profile.full_name } : null,
      email: profile?.email ?? undefined,
    }
  })
})

export type PortalMember = {
  userId: string
  fullName: string
  email: string
  currentRoles: AppRole[]
  /** Guest-written onboarding note, shown under their name for admins. */
  note: string | null
  /** Personal address that also receives their portal emails. */
  notificationEmail: string | null
}

export const getPortalMembers = cache(async (): Promise<PortalMember[]> => {
  await verifySession()
  const roles = await getUserRoles()
  const roleNames = roles.map((r) => r.role)
  const isAdmin = isOrgAdmin(roleNames)

  const admin = createAdminClient()

  let chapterIds: string[] | null = null

  if (!isAdmin) {
    chapterIds = roles
      .filter((r) =>
        ["chapter_officer", "chapter_president"].includes(r.role)
      )
      .map((r) => r.chapter_id)
      .filter(Boolean) as string[]

    if (chapterIds.length === 0) return []
  }

  let roleQuery = admin
    .from("user_roles")
    .select("user_id, role")
    .eq("status", "active")

  if (chapterIds) {
    roleQuery = roleQuery.in("chapter_id", chapterIds)
  }

  const { data: roleRows } = await roleQuery

  let applicantQuery = admin
    .from("applicants")
    .select("converted_user_id, full_name, email")
    .in("type", ["tutor", "officer", "volunteer"])
    .not("converted_user_id", "is", null)

  if (chapterIds) {
    applicantQuery = applicantQuery.in("chapter_id", chapterIds)
  }

  const { data: applicantRows } = await applicantQuery

  const userIds = [
    ...new Set([
      ...(roleRows ?? []).map((row) => row.user_id),
      ...(applicantRows ?? [])
        .map((row) => row.converted_user_id)
        .filter(Boolean) as string[],
    ]),
  ]

  // The board sees every account, including guests who signed up but hold no
  // role yet, so brand-new members can be granted their first role.
  let profiles: {
    id: string
    full_name: string | null
    email: string | null
    onboarding_note: string | null
    notification_email: string | null
  }[]
  const PROFILE_COLUMNS = "id, full_name, email, onboarding_note, notification_email"
  if (isBoard(roleNames)) {
    const { data } = await admin.from("profiles").select(PROFILE_COLUMNS)
    profiles = data ?? []
  } else {
    if (userIds.length === 0) return []
    const { data } = await admin
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .in("id", userIds)
    profiles = data ?? []
  }

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]))

  const rolesByUser = new Map<string, AppRole[]>()
  for (const row of roleRows ?? []) {
    const list = rolesByUser.get(row.user_id) ?? []
    list.push(row.role as AppRole)
    rolesByUser.set(row.user_id, list)
  }

  const memberIds = isBoard(roleNames)
    ? [...new Set([...profiles.map((p) => p.id), ...userIds])]
    : userIds

  const members: PortalMember[] = memberIds.map((userId) => {
    const profile = profileById.get(userId)
    return {
      userId,
      fullName: profile?.full_name ?? profile?.email ?? "Member",
      email: profile?.email ?? "",
      currentRoles: rolesByUser.get(userId) ?? [],
      note: profile?.onboarding_note ?? null,
      notificationEmail: profile?.notification_email ?? null,
    }
  })

  return members.sort((a, b) => a.fullName.localeCompare(b.fullName))
})

export type FamilyForReviewer = {
  parentUserId: string
  parentName: string
  parentEmail: string
  students: Student[]
}

export const getFamiliesForReviewer = cache(async (): Promise<FamilyForReviewer[]> => {
  await verifySession()
  const roles = await getUserRoles()
  const roleNames = roles.map((r) => r.role)
  const isAdmin = isOrgAdmin(roleNames)

  const supabase = await getServerClientOrThrow()
  const admin = createAdminClient()

  const chapterIds = isAdmin
    ? null
    : (roles
        .filter((r) =>
          ["chapter_officer", "chapter_president"].includes(r.role)
        )
        .map((r) => r.chapter_id)
        .filter(Boolean) as string[])

  if (!isAdmin && chapterIds?.length === 0) return []

  let parentRolesQuery = admin
    .from("user_roles")
    .select("user_id, chapter_id")
    .eq("role", "student_parent")
    .eq("status", "active")

  if (chapterIds) {
    parentRolesQuery = parentRolesQuery.in("chapter_id", chapterIds)
  }

  let studentsQuery = supabase
    .from("students")
    .select("*, chapters(name, slug)")
    .order("created_at", { ascending: false })

  if (chapterIds) {
    studentsQuery = studentsQuery.in("chapter_id", chapterIds)
  }

  const [{ data: parentRoles }, { data: students, error: studentsError }] =
    await Promise.all([parentRolesQuery, studentsQuery])

  if (studentsError) {
    console.error("getFamiliesForReviewer students", studentsError.message)
  }

  const parentIds = new Set<string>([
    ...(parentRoles ?? []).map((row) => row.user_id),
    ...(students ?? []).map((s) => s.parent_user_id),
  ])

  if (parentIds.size === 0) return []

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", [...parentIds])

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  )

  const families = new Map<string, FamilyForReviewer>()

  for (const parentId of parentIds) {
    const profile = profileById.get(parentId)
    families.set(parentId, {
      parentUserId: parentId,
      parentName: profile?.full_name ?? "Parent",
      parentEmail: profile?.email ?? "",
      students: [],
    })
  }

  for (const student of (students ?? []) as Student[]) {
    const family = families.get(student.parent_user_id)
    if (family) {
      family.students.push(student)
    }
  }

  return [...families.values()].sort((a, b) =>
    a.parentName.localeCompare(b.parentName)
  )
})

export const getStaffApplicationsForUser = cache(async (): Promise<Applicant[]> => {
  const user = await getSession()
  if (!user) return []

  const supabase = await getServerClientOrThrow()
  const { data, error } = await supabase
    .from("applicants")
    .select("*, chapters(name, slug)")
    .eq("converted_user_id", user.id)
    .in("type", ["tutor", "officer", "volunteer"])
    .order("created_at", { ascending: false })

  if (error) {
    console.error("getStaffApplicationsForUser", error.message)
    return []
  }

  return (data ?? []) as Applicant[]
})

export const getParentChapterOptions = cache(async (): Promise<Chapter[]> => {
  const roles = await getUserRoles()
  const parentRoles = roles.filter((r) => r.role === "student_parent")

  if (parentRoles.length === 0) return []

  const supabase = await getServerClientOrThrow()
  const chapterIds = parentRoles
    .map((r) => r.chapter_id)
    .filter(Boolean) as string[]

  const { data } = await supabase
    .from("chapters")
    .select("*")
    .in("id", chapterIds)
    .eq("status", "active")
    .order("name")

  return data ?? []
})

export const getDashboardContext = cache(async () => {
  const user = await verifySession()

  // The legacy accepted-applicant sweep runs at login (app/actions/auth.ts),
  // not here — a dashboard render should never carry a write side-effect.
  const [profile, roles] = await Promise.all([getProfile(), getUserRoles()])

  const roleNames = roles.map((r) => r.role)

  const [
    canReview,
    logVolunteerHours,
    approveVolunteerHours,
    auditMessages,
    viewDonations,
    manageDonations,
    viewAuditLogs,
    writeAuditLogs,
    manageLessons,
    manageEvents,
    manageChapters,
    assignRoles,
  ] = await Promise.all([
    canReviewApplicants(),
    canLogVolunteerHours(),
    canApproveVolunteerHours(),
    canAuditMessages(),
    canViewDonations(),
    canManageDonations(),
    canViewAuditLogs(),
    canWriteAuditLogs(),
    canManageLessons(),
    canManageEvents(),
    canManageChapters(),
    canAssignRoles(),
  ])

  return {
    user,
    profile,
    roles,
    roleNames,
    canReview,
    isParent: roleNames.includes("student_parent"),
    isTutor: roleNames.includes("tutor"),
    isVolunteer: roleNames.includes("volunteer"),
    canLogVolunteerHours: logVolunteerHours,
    canApproveVolunteerHours: approveVolunteerHours,
    canAuditMessages: auditMessages,
    canViewDonations: viewDonations,
    canManageDonations: manageDonations,
    canViewAuditLogs: viewAuditLogs,
    canWriteAuditLogs: writeAuditLogs,
    canManageLessons: manageLessons,
    canManageEvents: manageEvents,
    canManageChapters: manageChapters,
    canAssignRoles: assignRoles,
    hasPortalRole: roleNames.length > 0,
  }
})
