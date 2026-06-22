export const ROLES = [
  "student_parent",
  "tutor",
  "volunteer",
  "chapter_officer",
  "chapter_president",
  "corporate_officer",
  "program_administrator",
  "board_of_director",
] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  student_parent: "Student / Parent",
  tutor: "Tutor",
  volunteer: "Volunteer / Performer",
  chapter_officer: "Chapter Officer",
  chapter_president: "Chapter President",
  corporate_officer: "Corporate Officer",
  program_administrator: "Program Administrator",
  board_of_director: "Board of Director",
}
