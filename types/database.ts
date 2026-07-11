import type {
  ApplicantStage,
  ApplicantType,
  AppRole,
  AssignmentStatus,
  AttendanceStatus,
  ChapterStatus,
  ConsentType,
  EventStatus,
  LessonStatus,
  ResourceStorageType,
  RoleStatus,
  RsvpStatus,
  SkillLevel,
  StudentStatus,
  VolunteerHourCategory,
  VolunteerHourStatus,
  CertificateType,
  ConversationType,
  NotificationType,
  DonationStatus,
  DonationSource,
  AuditAction,
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
  paypalWebhookEvents: "paypal_webhook_events",
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
  email: string | null
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

export interface StudentTutorAssignment {
  id: string
  student_id: string
  tutor_user_id: string | null
  chapter_id: string
  status: RoleStatus
  assigned_by: string | null
  created_at: string
  students?: Pick<Student, "first_name" | "last_name" | "instrument"> | null
  /** Tutor display name (loaded separately, not a DB join). */
  profiles?: Pick<Profile, "full_name"> | null
  chapters?: Pick<Chapter, "name"> | null
}

export interface TutorAvailability {
  id: string
  tutor_user_id: string
  chapter_id: string
  day_of_week: number
  start_time: string
  end_time: string
  created_at: string
  chapters?: Pick<Chapter, "name" | "slug"> | null
}

export interface Lesson {
  id: string
  chapter_id: string
  tutor_user_id: string | null
  student_id: string
  scheduled_start: string
  scheduled_end: string
  status: LessonStatus
  location: string | null
  meeting_link: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  students?: Pick<Student, "first_name" | "last_name" | "instrument"> | null
  chapters?: Pick<Chapter, "name" | "slug"> | null
  lesson_logs?: LessonLog | null
}

export type LessonWithTutor = Lesson & {
  tutor?: { full_name: string } | null
}

export interface LessonLog {
  id: string
  lesson_id: string
  attendance: AttendanceStatus
  topics_covered: string | null
  tutor_notes: string | null
  created_by: string | null
  created_at: string
}

export interface PracticeLog {
  id: string
  student_id: string
  minutes: number
  practiced_on: string
  notes: string | null
  logged_by: string
  created_at: string
  students?: Pick<Student, "first_name" | "last_name"> | null
}

export interface Assignment {
  id: string
  student_id: string
  tutor_user_id: string | null
  lesson_id: string | null
  title: string
  description: string | null
  due_date: string | null
  status: AssignmentStatus
  created_at: string
  updated_at: string
  students?: Pick<Student, "first_name" | "last_name"> | null
}

export interface Resource {
  id: string
  chapter_id: string
  student_id: string | null
  uploaded_by: string
  title: string
  description: string | null
  storage_type: ResourceStorageType
  url: string | null
  storage_path: string | null
  created_at: string
  chapters?: Pick<Chapter, "name" | "slug"> | null
  students?: Pick<Student, "first_name" | "last_name"> | null
}

export interface Event {
  id: string
  chapter_id: string | null
  title: string
  description: string | null
  location: string | null
  starts_at: string
  ends_at: string
  capacity: number | null
  status: EventStatus
  created_by: string | null
  created_at: string
  updated_at: string
  chapters?: Pick<Chapter, "name" | "slug"> | null
}

export interface EventRsvp {
  id: string
  event_id: string
  user_id: string
  status: RsvpStatus
  created_at: string
  updated_at: string
}

export interface EventAttendance {
  id: string
  event_id: string
  user_id: string
  checked_in_at: string
  recorded_by: string | null
  created_at: string
}

export interface VolunteerHour {
  id: string
  user_id: string
  chapter_id: string
  category: VolunteerHourCategory
  hours: number
  activity_date: string
  description: string | null
  status: VolunteerHourStatus
  approved_by: string | null
  approved_at: string | null
  rejected_by: string | null
  rejected_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  chapters?: Pick<Chapter, "name" | "slug"> | null
  profiles?: { full_name: string } | null
}

export interface Certificate {
  id: string
  user_id: string
  chapter_id: string
  certificate_type: CertificateType
  title: string
  total_hours: number
  period_start: string
  period_end: string
  storage_path: string | null
  issued_at: string
  issued_by: string | null
  source_hour_ids: string[]
  created_at: string
  chapters?: Pick<Chapter, "name" | "slug"> | null
}

export interface Conversation {
  id: string
  chapter_id: string
  student_id: string
  tutor_user_id: string
  conversation_type: ConversationType
  created_at: string
  updated_at: string
  students?: Pick<Student, "first_name" | "last_name"> | null
  chapters?: Pick<Chapter, "name" | "slug"> | null
}

export interface ConversationMember {
  conversation_id: string
  user_id: string
  joined_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  deleted_at: string | null
  created_at: string
  updated_at: string
  profiles?: { full_name: string } | null
}

export interface Announcement {
  id: string
  chapter_id: string | null
  title: string
  body: string
  published_at: string
  created_by: string | null
  created_at: string
  chapters?: Pick<Chapter, "name" | "slug"> | null
}

export interface Notification {
  id: string
  user_id: string
  notification_type: NotificationType
  title: string
  body: string | null
  link_path: string | null
  read_at: string | null
  created_at: string
}

export type ConversationWithPreview = Conversation & {
  last_message?: Pick<Message, "body" | "created_at" | "sender_id"> | null
  tutor_name?: string | null
  parent_name?: string | null
}

export interface Donation {
  id: string
  chapter_id: string | null
  amount: number
  currency: string
  net_amount: number | null
  fee_amount: number | null
  status: DonationStatus
  source: DonationSource
  paypal_capture_id: string
  paypal_event_id: string | null
  payer_email: string | null
  payer_name: string | null
  donated_at: string
  notes: string | null
  raw_payload: Record<string, unknown> | null
  recorded_by: string | null
  created_at: string
  updated_at: string
  recorder_name?: string | null
}

export interface DonationTotals {
  totalAmount: number
  completedCount: number
  last30DaysAmount: number
}

export interface AuditLog {
  id: string
  actor_user_id: string | null
  action: AuditAction
  entity_type: string
  entity_id: string | null
  chapter_id: string | null
  summary: string
  metadata: Record<string, unknown>
  created_at: string
  actor_name?: string | null
}

export interface PaypalWebhookEvent {
  paypal_event_id: string
  event_type: string
  processed_at: string
  donation_id: string | null
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
      student_tutor_assignments: {
        Row: StudentTutorAssignment
        Insert: {
          id?: string
          student_id: string
          tutor_user_id?: string | null
          chapter_id: string
          status?: RoleStatus
          assigned_by?: string | null
          created_at?: string
        }
        Update: Partial<StudentTutorAssignment>
      }
      tutor_availability: {
        Row: TutorAvailability
        Insert: {
          id?: string
          tutor_user_id: string
          chapter_id: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at?: string
        }
        Update: Partial<TutorAvailability>
      }
      lessons: {
        Row: Lesson
        Insert: {
          id?: string
          chapter_id: string
          tutor_user_id?: string | null
          student_id: string
          scheduled_start: string
          scheduled_end: string
          status?: LessonStatus
          location?: string | null
          meeting_link?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Lesson>
      }
      lesson_logs: {
        Row: LessonLog
        Insert: {
          id?: string
          lesson_id: string
          attendance: AttendanceStatus
          topics_covered?: string | null
          tutor_notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: Partial<LessonLog>
      }
      practice_logs: {
        Row: PracticeLog
        Insert: {
          id?: string
          student_id: string
          minutes: number
          practiced_on?: string
          notes?: string | null
          logged_by: string
          created_at?: string
        }
        Update: Partial<PracticeLog>
      }
      assignments: {
        Row: Assignment
        Insert: {
          id?: string
          student_id: string
          tutor_user_id?: string | null
          lesson_id?: string | null
          title: string
          description?: string | null
          due_date?: string | null
          status?: AssignmentStatus
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Assignment>
      }
      resources: {
        Row: Resource
        Insert: {
          id?: string
          chapter_id: string
          student_id?: string | null
          uploaded_by: string
          title: string
          description?: string | null
          storage_type: ResourceStorageType
          url?: string | null
          storage_path?: string | null
          created_at?: string
        }
        Update: Partial<Resource>
      }
      events: {
        Row: Event
        Insert: {
          id?: string
          chapter_id?: string | null
          title: string
          description?: string | null
          location?: string | null
          starts_at: string
          ends_at: string
          capacity?: number | null
          status?: EventStatus
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Event>
      }
      event_rsvps: {
        Row: EventRsvp
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status: RsvpStatus
          created_at?: string
          updated_at?: string
        }
        Update: Partial<EventRsvp>
      }
      event_attendance: {
        Row: EventAttendance
        Insert: {
          id?: string
          event_id: string
          user_id: string
          checked_in_at?: string
          recorded_by?: string | null
          created_at?: string
        }
        Update: Partial<EventAttendance>
      }
      volunteer_hours: {
        Row: VolunteerHour
        Insert: {
          id?: string
          user_id: string
          chapter_id: string
          category: VolunteerHourCategory
          hours: number
          activity_date: string
          description?: string | null
          status?: VolunteerHourStatus
          approved_by?: string | null
          approved_at?: string | null
          rejected_by?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<VolunteerHour>
      }
      certificates: {
        Row: Certificate
        Insert: {
          id?: string
          user_id: string
          chapter_id: string
          certificate_type?: CertificateType
          title: string
          total_hours: number
          period_start: string
          period_end: string
          storage_path?: string | null
          issued_at?: string
          issued_by?: string | null
          source_hour_ids?: string[]
          created_at?: string
        }
        Update: Partial<Certificate>
      }
      conversations: {
        Row: Conversation
        Insert: {
          id?: string
          chapter_id: string
          student_id: string
          tutor_user_id: string
          conversation_type?: ConversationType
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Conversation>
      }
      conversation_members: {
        Row: ConversationMember
        Insert: {
          conversation_id: string
          user_id: string
          joined_at?: string
        }
        Update: Partial<ConversationMember>
      }
      messages: {
        Row: Message
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          body: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Message>
      }
      announcements: {
        Row: Announcement
        Insert: {
          id?: string
          chapter_id?: string | null
          title: string
          body: string
          published_at?: string
          created_by?: string | null
          created_at?: string
        }
        Update: Partial<Announcement>
      }
      notifications: {
        Row: Notification
        Insert: {
          id?: string
          user_id: string
          notification_type: NotificationType
          title: string
          body?: string | null
          link_path?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: Partial<Notification>
      }
      donations: {
        Row: Donation
        Insert: {
          id?: string
          chapter_id?: string | null
          amount: number
          currency?: string
          net_amount?: number | null
          fee_amount?: number | null
          status?: DonationStatus
          source?: DonationSource
          paypal_capture_id: string
          paypal_event_id?: string | null
          payer_email?: string | null
          payer_name?: string | null
          donated_at: string
          notes?: string | null
          raw_payload?: Record<string, unknown> | null
          recorded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Donation>
      }
      audit_logs: {
        Row: AuditLog
        Insert: {
          id?: string
          actor_user_id?: string | null
          action: AuditAction
          entity_type: string
          entity_id?: string | null
          chapter_id?: string | null
          summary: string
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: Partial<AuditLog>
      }
      paypal_webhook_events: {
        Row: PaypalWebhookEvent
        Insert: {
          paypal_event_id: string
          event_type: string
          processed_at?: string
          donation_id?: string | null
        }
        Update: Partial<PaypalWebhookEvent>
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
