import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"

export type QuickAction = {
  label: string
  description: string
  href: string
  icon: LucideIcon
}

export function QuickActionsGrid({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map((action, index) => {
        const Icon = action.icon
        return (
          <Link
            key={action.href + action.label}
            href={action.href}
            className="animate-fade-up group flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ "--stagger-index": index } as React.CSSProperties}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-transform duration-200 group-hover:scale-110">
              <Icon className="h-5 w-5 text-primary" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {action.label}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {action.description}
              </span>
            </span>
            <ArrowRight
              aria-hidden
              className="h-4 w-4 shrink-0 text-muted-foreground/0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground"
            />
          </Link>
        )
      })}
    </div>
  )
}
