import { cn } from "@/lib/utils"

type SectionProps = {
  children: React.ReactNode
  className?: string
  id?: string
  variant?: "default" | "muted" | "primary"
}

export function Section({ children, className, id, variant = "default" }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-16 md:py-24",
        variant === "muted" && "bg-card/40",
        variant === "primary" && "noc-section-ground",
        className
      )}
    >
      <div className="container mx-auto px-4">{children}</div>
    </section>
  )
}

type SectionHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  align?: "left" | "center"
  className?: string
  light?: boolean
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeaderProps) {
  return (
    <div
      data-reveal="1"
      className={cn(
        "mb-10 max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "noc-eyebrow mb-5",
            align === "center" && "noc-eyebrow-center"
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl tracking-tight text-foreground md:text-[clamp(34px,3.3vw,48px)] md:leading-[1.12]">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-[16.5px] leading-[1.75] text-[var(--noc-neutral-300)]">
          {description}
        </p>
      )}
    </div>
  )
}
