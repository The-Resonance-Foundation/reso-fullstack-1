import { cn } from "@/lib/utils"

type PageHeroProps = {
  title: string
  subtitle?: string
  className?: string
  compact?: boolean
}

export function PageHero({ title, subtitle, className, compact }: PageHeroProps) {
  return (
    <section
      className={cn(
        "border-b border-border bg-gradient-to-b from-secondary/80 to-background",
        compact ? "pt-28 pb-12" : "pt-32 pb-16 md:pt-36 md:pb-20",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">{subtitle}</p>
          )}
        </div>
      </div>
    </section>
  )
}
