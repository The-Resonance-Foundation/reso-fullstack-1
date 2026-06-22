export const APP_ROLES = [
  "student_parent",
  "tutor",
  "volunteer",
  "chapter_officer",
  "chapter_president",
  "corporate_officer",
  "program_administrator",
  "board_of_director",
] as const

export type AppRole = (typeof APP_ROLES)[number]

export const ROLE_STATUSES = ["pending", "active", "inactive"] as const
export type RoleStatus = (typeof ROLE_STATUSES)[number]

export const CHAPTER_STATUSES = ["active", "inactive"] as const
export type ChapterStatus = (typeof CHAPTER_STATUSES)[number]

export const STUDENT_STATUSES = [
  "pending",
  "active",
  "inactive",
  "alumni",
  "rejected",
] as const
export type StudentStatus = (typeof STUDENT_STATUSES)[number]

/** Staff application types (student enrollment uses students table directly). */
export const APPLICANT_TYPES = ["tutor", "officer", "volunteer"] as const
export type ApplicantType = (typeof APPLICANT_TYPES)[number]

/** @deprecated Legacy rows only — do not create new student applicants. */
export const LEGACY_APPLICANT_TYPES = ["student", ...APPLICANT_TYPES] as const

export const APPLICANT_STAGES = [
  "interested",
  "applied",
  "accepted",
  "active",
  "alumni",
  "rejected",
] as const
export type ApplicantStage = (typeof APPLICANT_STAGES)[number]

export const CONSENT_TYPES = [
  "photo_release",
  "liability_waiver",
  "code_of_conduct",
  "financial_aid",
] as const
export type ConsentType = (typeof CONSENT_TYPES)[number]

/** Required guardian consents for v1 (checkbox bundle). */
export const V1_REQUIRED_CONSENTS = [
  "photo_release",
  "liability_waiver",
  "code_of_conduct",
] as const satisfies readonly ConsentType[]

export const SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const
export type SkillLevel = (typeof SKILL_LEVELS)[number]

export const OFFICER_POSITIONS = [
  "chapter_officer",
  "chapter_president",
] as const satisfies readonly AppRole[]

export const CHAPTER_OFFICER_ROLES: AppRole[] = [
  "chapter_officer",
  "chapter_president",
]

export const ORG_ADMIN_ROLES: AppRole[] = [
  "board_of_director",
  "program_administrator",
  "corporate_officer",
]

export function isOrgAdmin(roles: AppRole[]) {
  return roles.some((role) => ORG_ADMIN_ROLES.includes(role))
}

export function isBoard(roles: AppRole[]) {
  return roles.includes("board_of_director")
}

export function canManageChapter(roles: AppRole[], chapterId: string, roleChapterIds: (string | null)[]) {
  if (isOrgAdmin(roles)) return true
  return roles.some(
    (role, index) =>
      CHAPTER_OFFICER_ROLES.includes(role) && roleChapterIds[index] === chapterId
  )
}
