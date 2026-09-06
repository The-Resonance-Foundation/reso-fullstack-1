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

/** Break "1,000+", "$1000s", "100%" into count-up parts for [data-count]. */
function parseStat(value: string) {
  const m = value.match(/^([^\d]*)([\d,]+)(.*)$/)
  if (!m) return null
  const num = parseInt(m[2].replace(/,/g, ""), 10)
  if (Number.isNaN(num)) return null
  return {
    prefix: m[1],
    target: num,
    suffix: m[3],
    comma: m[2].includes(","),
  }
}

/** Desktop columns per stat count, so the row always divides evenly. */
const COLUMN_CLASS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
}

export function StatsBar({ stats, variant = "primary", className }: StatsBarProps) {
  return (
    <section
      className={cn(
        "py-14 md:py-[74px]",
        variant === "primary" ? "noc-section-ground" : "border-y border-border bg-card/40",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "grid grid-cols-2 gap-8 md:gap-10",
            // Match the column count to the number of stats so the row never
            // leaves a stranded item on its own line.
            COLUMN_CLASS[stats.length] ?? "md:grid-cols-4"
          )}
        >
          {stats.map((stat) => {
            const parsed = parseStat(stat.value)
            return (
              <div key={stat.label} data-reveal="1" className="text-center md:text-left">
                <div className="text-4xl tracking-[-0.02em] text-[var(--noc-accent-100)] [font-variant-numeric:tabular-nums] md:text-[clamp(40px,3.6vw,56px)]">
                  {parsed ? (
                    <span
                      data-count={parsed.target}
                      data-prefix={parsed.prefix || undefined}
                      data-suffix={parsed.suffix || undefined}
                      data-comma={parsed.comma ? "1" : undefined}
                    >
                      {stat.value}
                    </span>
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="mt-2 text-[12.5px] uppercase tracking-[0.2em] text-[var(--noc-accent-2-200)]">
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
