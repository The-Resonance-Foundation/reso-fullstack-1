import { z } from "zod"
import {
  ASSIGNMENT_STATUSES,
  ATTENDANCE_STATUSES,
  DAYS_OF_WEEK,
  EVENT_STATUSES,
  LESSON_STATUSES,
  RESOURCE_STORAGE_TYPES,
  RSVP_STATUSES,
  SKILL_LEVELS,
} from "@/types/enums"

export type FormState =
  | {
      errors?: Record<string, string[] | undefined>
      message?: string
      success?: boolean
    }
  | undefined

export const availabilitySchema = z.object({
  chapterId: z.uuid({ error: "Please select a chapter." }),
  dayOfWeek: z.coerce
    .number()
    .int()
    .min(0, { error: "Invalid day." })
    .max(6, { error: "Invalid day." }),
  startTime: z.string().min(1, { error: "Start time is required." }),
  endTime: z.string().min(1, { error: "End time is required." }),
})

export const scheduleLessonSchema = z.object({
  studentId: z.uuid({ error: "Please select a student." }),
  chapterId: z.string().optional(),
  scheduledStart: z.string().min(1, { error: "Start time is required." }),
  scheduledEnd: z.string().min(1, { error: "End time is required." }),
  location: z.string().trim().optional(),
  meetingLink: z.string().url({ error: "Enter a valid URL." }).optional().or(z.literal("")),
})

export const lessonLogSchema = z.object({
  lessonId: z.uuid(),
  attendance: z.enum(ATTENDANCE_STATUSES),
  topicsCovered: z.string().trim().optional(),
  tutorNotes: z.string().trim().optional(),
})

export const updateLessonStatusSchema = z.object({
  lessonId: z.uuid(),
  status: z.enum(LESSON_STATUSES),
})

export const practiceLogSchema = z.object({
  studentId: z.uuid({ error: "Please select a student." }),
  minutes: z.coerce.number().int().min(1, { error: "Minutes must be at least 1." }),
  practicedOn: z.string().min(1, { error: "Date is required." }),
  notes: z.string().trim().optional(),
})

export const assignmentSchema = z.object({
  studentId: z.uuid({ error: "Please select a student." }),
  title: z.string().min(2, { error: "Title is required." }).trim(),
  description: z.string().trim().optional(),
  dueDate: z.string().optional(),
  lessonId: z.uuid().optional().or(z.literal("")),
})

export const updateAssignmentStatusSchema = z.object({
  assignmentId: z.uuid(),
  status: z.enum(ASSIGNMENT_STATUSES),
})

export const resourceSchema = z.object({
  chapterId: z.uuid({ error: "Please select a chapter." }),
  studentId: z.string().optional(),
  title: z.string().min(2, { error: "Title is required." }).trim(),
  description: z.string().trim().optional(),
  storageType: z.enum(RESOURCE_STORAGE_TYPES),
  url: z.string().trim().optional(),
})

export const tutorAssignmentSchema = z.object({
  studentId: z.uuid({ error: "Please select a student." }),
  tutorUserId: z.uuid({ error: "Please select a tutor." }),
  chapterId: z.string().optional(),
})

export const eventSchema = z.object({
  chapterId: z.string().optional(),
  title: z.string().min(2, { error: "Title is required." }).trim(),
  description: z.string().trim().optional(),
  location: z.string().trim().optional(),
  startsAt: z.string().min(1, { error: "Start time is required." }),
  endsAt: z.string().min(1, { error: "End time is required." }),
  capacity: z.coerce.number().int().positive().optional().or(z.literal("")),
  status: z.enum(EVENT_STATUSES).default("published"),
})

export const rsvpSchema = z.object({
  eventId: z.uuid(),
  status: z.enum(RSVP_STATUSES),
})

export const attendanceSchema = z.object({
  eventId: z.uuid(),
  userId: z.uuid(),
})

export const applicantStageSchema = z.object({
  applicantId: z.uuid(),
  stage: z.enum([
    "interested",
    "applied",
    "accepted",
    "active",
    "alumni",
    "rejected",
  ] as const),
})

export type AvailabilityFormState = FormState
export type LessonFormState = FormState
export type PracticeFormState = FormState
export type AssignmentFormState = FormState
export type ResourceFormState = FormState
export type TutorAssignmentFormState = FormState
export type EventFormState = FormState
export type RsvpFormState = FormState
export type ApplicantStageFormState = FormState

export { DAYS_OF_WEEK, SKILL_LEVELS }
