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

export const LESSON_STATUSES = [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
] as const
export type LessonStatus = (typeof LESSON_STATUSES)[number]

export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "excused",
] as const
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

export const ASSIGNMENT_STATUSES = [
  "assigned",
  "submitted",
  "completed",
] as const
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number]

export const RESOURCE_STORAGE_TYPES = ["link", "drive", "supabase"] as const
export type ResourceStorageType = (typeof RESOURCE_STORAGE_TYPES)[number]

export const EVENT_STATUSES = [
  "draft",
  "published",
  "cancelled",
  "completed",
] as const
export type EventStatus = (typeof EVENT_STATUSES)[number]

export const RSVP_STATUSES = ["going", "maybe", "declined"] as const
export type RsvpStatus = (typeof RSVP_STATUSES)[number]

export const VOLUNTEER_HOUR_CATEGORIES = [
  "teaching",
  "event_support",
  "admin_work",
] as const
export type VolunteerHourCategory = (typeof VOLUNTEER_HOUR_CATEGORIES)[number]

export const VOLUNTEER_HOUR_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const
export type VolunteerHourStatus = (typeof VOLUNTEER_HOUR_STATUSES)[number]

export const CERTIFICATE_TYPES = ["volunteer_service"] as const
export type CertificateType = (typeof CERTIFICATE_TYPES)[number]

export const CONVERSATION_TYPES = ["tutor_student"] as const
export type ConversationType = (typeof CONVERSATION_TYPES)[number]

export const NOTIFICATION_TYPES = [
  "message",
  "announcement",
  "volunteer_approved",
  "assignment",
  "event",
] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export const DONATION_STATUSES = [
  "completed",
  "refunded",
  "reversed",
  "pending",
] as const
export type DonationStatus = (typeof DONATION_STATUSES)[number]

export const DONATION_SOURCES = ["paypal_webhook", "manual"] as const
export type DonationSource = (typeof DONATION_SOURCES)[number]

export const AUDIT_ACTIONS = [
  "donation_received",
  "donation_refunded",
  "donation_reversed",
  "donation_manual",
  "audit_note",
  "role_changed",
] as const
export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export function isCorporateOfficer(roles: AppRole[]) {
  return roles.includes("corporate_officer")
}

export function canViewDonations(roles: AppRole[]) {
  return (
    isBoard(roles) ||
    isProgramAdmin(roles) ||
    isCorporateOfficer(roles)
  )
}

export function canManageDonations(roles: AppRole[]) {
  return isBoard(roles) || isCorporateOfficer(roles)
}

export function canViewAuditLogs(roles: AppRole[]) {
  return isBoard(roles) || isProgramAdmin(roles)
}

export function canWriteAuditLogs(roles: AppRole[]) {
  return isBoard(roles) || isProgramAdmin(roles)
}

export function isProgramAdmin(roles: AppRole[]) {
  return roles.includes("program_administrator")
}

export function canAuditMessageThreads(
  roles: AppRole[],
  roleChapterIds: (string | null)[],
  chapterId: string
) {
  if (roles.includes("board_of_director")) return true
  if (roles.includes("program_administrator")) return true
  return roles.some(
    (role, index) =>
      role === "chapter_president" && roleChapterIds[index] === chapterId
  )
}

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const
