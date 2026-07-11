import {
  CircleDollarSign,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import { timeAgo } from "@/lib/utils"
import type { ActivityItem } from "@/lib/data/dashboard"

const ACTION_ICONS: Record<string, LucideIcon> = {
  donation_manual: CircleDollarSign,
  donation_recorded: CircleDollarSign,
  role_changed: ShieldCheck,
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <ScrollText className="h-5 w-5 text-muted-foreground" aria-hidden />
        </span>
        <p className="text-sm text-muted-foreground">
          Activity will appear here as your team works.
        </p>
      </div>
    )
  }

  return (
    <ol className="space-y-1">
      {items.map((item, index) => {
        const Icon = ACTION_ICONS[item.action] ?? ScrollText
        return (
          <li
            key={item.id}
            className="animate-fade-up flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
            style={{ "--stagger-index": index } as React.CSSProperties}
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{item.summary}</p>
              <p className="text-xs text-muted-foreground">
                {item.actorName ? `${item.actorName} · ` : ""}
                {timeAgo(item.createdAt)}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
