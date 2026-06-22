import type {
  ApplicantStage,
  ApplicantType,
  AppRole,
  ChapterStatus,
  ConsentType,
  RoleStatus,
  SkillLevel,
  StudentStatus,
} from "./enums"

export const TABLES = {
  chapters: "chapters",
  profiles: "profiles",
  userRoles: "user_roles",
  students: "students",
  guardianConsents: "guardian_consents",
  applicants: "applicants",
  tutorAvailability: "tutor_availability",
  lessons: "lessons",
  lessonLogs: "lesson_logs",
  practiceLogs: "practice_logs",
  assignments: "assignments",
  resources: "resources",
  certificates: "certificates",
  events: "events",
  eventRsvps: "event_rsvps",
  eventAttendance: "event_attendance",
  volunteerHours: "volunteer_hours",
  conversations: "conversations",
  conversationMembers: "conversation_members",
  messages: "messages",
  announcements: "announcements",
  notifications: "notifications",
  donations: "donations",
  auditLogs: "audit_logs",
} as const

export interface Chapter {
  id: string
  name: string
  slug: string
  city: string | null
  state: string | null
  status: ChapterStatus
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  user_id: string
  chapter_id: string | null
  role: AppRole
  status: RoleStatus
  created_at: string
  chapters?: Pick<Chapter, "name" | "slug"> | null
}

export interface Student {
  id: string
  parent_user_id: string
  chapter_id: string
  first_name: string
  last_name: string
  instrument: string | null
  skill_level: SkillLevel | null
  financial_aid: boolean
  status: StudentStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  chapters?: Pick<Chapter, "name" | "slug"> | null
}

export interface GuardianConsent {
  id: string
  student_id: string
  consent_type: ConsentType
  signed_by_user_id: string
  signed_at: string
  document_path: string | null
  created_at: string
}

export interface Applicant {
  id: string
  type: ApplicantType
  chapter_id: string
  full_name: string
  email: string
  phone: string | null
  parent_name: string | null
  parent_email: string | null
  student_name: string | null
  linked_student_id: string | null
  instrument: string | null
  skill_level: SkillLevel | null
  message: string | null
  requested_role: AppRole | null
  stage: ApplicantStage
  converted_user_id: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
  chapters?: Pick<Chapter, "name" | "slug"> | null
}

export interface Database {
  public: {
    Tables: {
      chapters: {
        Row: Chapter
        Insert: {
          id?: string
          name: string
          slug: string
          city?: string | null
          state?: string | null
          status?: ChapterStatus
          created_at?: string
        }
        Update: Partial<Chapter>
      }
      profiles: {
        Row: Profile
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Profile>
      }
      user_roles: {
        Row: UserRole
        Insert: {
          id?: string
          user_id: string
          chapter_id?: string | null
          role: AppRole
          status?: RoleStatus
          created_at?: string
        }
        Update: Partial<UserRole>
      }
      students: {
        Row: Student
        Insert: {
          id?: string
          parent_user_id: string
          chapter_id: string
          first_name: string
          last_name: string
          instrument?: string | null
          skill_level?: SkillLevel | null
          financial_aid?: boolean
          status?: StudentStatus
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: Partial<Student>
      }
      guardian_consents: {
        Row: GuardianConsent
        Insert: {
          id?: string
          student_id: string
          consent_type: ConsentType
          signed_by_user_id: string
          signed_at?: string
          document_path?: string | null
          created_at?: string
        }
        Update: Partial<GuardianConsent>
      }
      applicants: {
        Row: Applicant
        Insert: {
          id?: string
          type: ApplicantType
          chapter_id: string
          full_name: string
          email: string
          phone?: string | null
          parent_name?: string | null
          parent_email?: string | null
          student_name?: string | null
          linked_student_id?: string | null
          instrument?: string | null
          skill_level?: SkillLevel | null
          message?: string | null
          requested_role?: AppRole | null
          stage?: ApplicantStage
          converted_user_id?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Applicant>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
