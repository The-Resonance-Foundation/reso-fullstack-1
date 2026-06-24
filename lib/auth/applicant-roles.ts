import type { Applicant } from "@/types/database"
import type { ApplicantType, AppRole } from "@/types/enums"

export function roleForApplicant(
  applicant: Pick<Applicant, "type" | "requested_role">
): AppRole {
  if (applicant.type === "officer") {
    return applicant.requested_role ?? "chapter_officer"
  }

  const map: Record<Exclude<ApplicantType, "officer">, AppRole> = {
    tutor: "tutor",
    volunteer: "volunteer",
  }

  return map[applicant.type as Exclude<ApplicantType, "officer">]
}
