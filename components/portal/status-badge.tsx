import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * Shared semantic status tint used across applicant stages, student
 * statuses, and chapter member statuses: success (active/accepted),
 * warning (pending/applied/interested), destructive (rejected), and a
 * neutral "secondary" for everything else (alumni, inactive, etc).
 */
const TINTS: Record<string, string> = {
  active: "bg-success/15 text-success border-transparent",
  accepted: "bg-success/15 text-success border-transparent",
  applied: "bg-warning/15 text-warning border-transparent",
  interested: "bg-warning/15 text-warning border-transparent",
  pending: "bg-warning/15 text-warning border-transparent",
  rejected: "bg-destructive/15 text-destructive border-transparent",
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string
  label?: string
  className?: string
}) {
  const tint = TINTS[status]
  const text = label ?? status

  if (!tint) {
    return (
      <Badge variant="secondary" className={cn("capitalize", className)}>
        {text}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={cn("capitalize", tint, className)}>
      {text}
    </Badge>
  )
}
