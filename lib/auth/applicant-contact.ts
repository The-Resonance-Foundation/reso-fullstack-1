import type { Applicant } from "@/types/database"

export function getApplicantInviteEmail(applicant: Applicant) {
  return applicant.email
}

export function getApplicantInviteName(applicant: Applicant) {
  return applicant.full_name
}
