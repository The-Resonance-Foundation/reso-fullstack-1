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
            className="animate-fade-up group flex items-center gap-3.5 rounded-2xl bg-[rgba(255,241,224,0.03)] p-4 transition-all duration-200 hover:-translate-y-[3px] hover:bg-[rgba(255,243,228,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ "--stagger-index": index } as React.CSSProperties}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[color-mix(in_oklab,var(--acc,#f08c2e)_13%,transparent)] transition-transform duration-200 group-hover:scale-110">
              <Icon className="h-[17px] w-[17px] text-[var(--acc-hi,#F8B269)]" aria-hidden />
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
