export { canAuditMessageThreads } from "@/types/enums"

export function messagePreview(body: string, max = 80) {
  const trimmed = body.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max)}…`
}
