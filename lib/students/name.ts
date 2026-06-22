export function splitStudentName(name: string) {
  const trimmed = name.trim()
  const parts = trimmed.split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return { first_name: "Student", last_name: "" }
  }

  if (parts.length === 1) {
    return { first_name: parts[0], last_name: parts[0] }
  }

  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  }
}
