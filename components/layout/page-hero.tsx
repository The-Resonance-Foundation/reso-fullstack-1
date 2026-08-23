import { cn } from "@/lib/utils"

type PageHeroProps = {
  title: string
  subtitle?: string
  eyebrow?: string
  className?: string
  compact?: boolean
}

export function PageHero({ title, subtitle, eyebrow, className, compact }: PageHeroProps) {
  return (
    <section
      className={cn(
        compact ? "pt-32 pb-10 md:pt-36" : "pt-36 pb-14 md:pt-[190px] md:pb-[90px]",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-[820px]">
          {eyebrow && <p className="noc-eyebrow mb-5">{eyebrow}</p>}
          <h1 className="text-4xl leading-[1.05] tracking-[-0.02em] text-foreground md:text-[clamp(44px,5vw,72px)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-5 max-w-[640px] text-lg leading-[1.65] text-[var(--noc-neutral-300)]">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
