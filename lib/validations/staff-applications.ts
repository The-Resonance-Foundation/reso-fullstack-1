import { z } from "zod"
import { OFFICER_POSITIONS, SKILL_LEVELS } from "@/types/enums"

const sharedFields = {
  chapterId: z.uuid({ error: "Please select a chapter." }),
  message: z.string().trim().max(2000).optional(),
}

export const tutorApplicationSchema = z.object({
  type: z.literal("tutor"),
  ...sharedFields,
  instrument: z.string().min(1, { error: "Please specify an instrument." }).trim(),
})

export const officerApplicationSchema = z.object({
  type: z.literal("officer"),
  ...sharedFields,
  requestedRole: z.enum(OFFICER_POSITIONS, {
    error: "Please select a position.",
  }),
})

export const volunteerApplicationSchema = z.object({
  type: z.literal("volunteer"),
  ...sharedFields,
})

export const staffApplicationSchema = z.discriminatedUnion("type", [
  tutorApplicationSchema,
  officerApplicationSchema,
  volunteerApplicationSchema,
])

export type StaffApplicationFormState =
  | {
      errors?: Record<string, string[] | undefined>
      message?: string
      success?: boolean
    }
  | undefined
