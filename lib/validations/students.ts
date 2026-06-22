import { z } from "zod"
import { SKILL_LEVELS, V1_REQUIRED_CONSENTS } from "@/types/enums"

export const addStudentSchema = z.object({
  studentName: z
    .string()
    .min(2, { error: "Student name must be at least 2 characters." })
    .trim(),
  chapterId: z.uuid({ error: "Please select a chapter." }),
  instrument: z.string().min(1, { error: "Please specify an instrument." }).trim(),
  skillLevel: z.enum(SKILL_LEVELS).optional(),
  consentsAccepted: z
    .string()
    .refine((value) => value === "on", {
      error: "You must accept the required policies and consents.",
    }),
})

export type AddStudentFormState =
  | {
      errors?: Record<string, string[] | undefined>
      message?: string
      success?: boolean
    }
  | undefined

export const REQUIRED_CONSENT_COUNT = V1_REQUIRED_CONSENTS.length
