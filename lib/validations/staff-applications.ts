import { z } from "zod"
import { CORPORATE_POSITIONS, REQUESTABLE_OFFICER_ROLES } from "@/types/enums"

const sharedFields = {
  message: z.string().trim().max(2000).optional(),
}

export const tutorApplicationSchema = z.object({
  type: z.literal("tutor"),
  chapterId: z.uuid({ error: "Please select a chapter." }),
  ...sharedFields,
  instrument: z.string().min(1, { error: "Please specify an instrument." }).trim(),
})

// Chapter is validated in the union-level superRefine: chapter positions
// require one, corporate positions (corporate officer, program admin) reject one.
export const officerApplicationSchema = z.object({
  type: z.literal("officer"),
  chapterId: z.uuid({ error: "Please select a chapter." }).optional(),
  ...sharedFields,
  requestedRole: z.enum(REQUESTABLE_OFFICER_ROLES, {
    error: "Please select a position.",
  }),
})

export const volunteerApplicationSchema = z.object({
  type: z.literal("volunteer"),
  chapterId: z.uuid({ error: "Please select a chapter." }),
  ...sharedFields,
})

export const staffApplicationSchema = z
  .discriminatedUnion("type", [
    tutorApplicationSchema,
    officerApplicationSchema,
    volunteerApplicationSchema,
  ])
  .superRefine((data, ctx) => {
    if (data.type !== "officer") return
    const corporate = (CORPORATE_POSITIONS as readonly string[]).includes(
      data.requestedRole
    )
    if (corporate && data.chapterId) {
      ctx.addIssue({
        code: "custom",
        path: ["chapterId"],
        message: "Corporate positions are not tied to a chapter.",
      })
    }
    if (!corporate && !data.chapterId) {
      ctx.addIssue({
        code: "custom",
        path: ["chapterId"],
        message: "Please select a chapter.",
      })
    }
  })

export type StaffApplicationFormState =
  | {
      errors?: Record<string, string[] | undefined>
      message?: string
      success?: boolean
    }
  | undefined
