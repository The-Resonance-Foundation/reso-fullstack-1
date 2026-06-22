import { cn } from "@/lib/utils"

type Stat = {
  value: string
  label: string
}

type StatsBarProps = {
  stats: Stat[]
  variant?: "default" | "primary"
  className?: string
}

export function StatsBar({ stats, variant = "primary", className }: StatsBarProps) {
  const isPrimary = variant === "primary"

  return (
    <section
      className={cn(
        "py-12 md:py-14",
        isPrimary ? "bg-primary text-primary-foreground" : "border-y border-border bg-card",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-serif text-3xl font-bold md:text-4xl">{stat.value}</div>
              <div
                className={cn(
                  "mt-1 text-sm",
                  isPrimary ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
