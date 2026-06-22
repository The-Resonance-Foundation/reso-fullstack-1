import { z } from "zod"
import { APPLICANT_TYPES } from "@/types/enums"

/** @deprecated Public applicant forms removed — staff apps use staff-applications validation. */
export type ApplicantFormState =
  | {
      errors?: Record<string, string[] | undefined>
      message?: string
      success?: boolean
    }
  | undefined

export function isStaffApplicantType(
  type: string
): type is (typeof APPLICANT_TYPES)[number] {
  return (APPLICANT_TYPES as readonly string[]).includes(type)
}
