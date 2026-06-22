import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CTAButton = {
  label: string
  href: string
  external?: boolean
  variant?: "default" | "secondary" | "outline"
}

type CTABandProps = {
  title: string
  description?: string
  buttons: CTAButton[]
  variant?: "default" | "primary"
  className?: string
}

export function CTABand({
  title,
  description,
  buttons,
  variant = "primary",
  className,
}: CTABandProps) {
  const isPrimary = variant === "primary"

  return (
    <section
      className={cn(
        "py-16 md:py-20",
        isPrimary ? "bg-primary text-primary-foreground" : "bg-muted/60",
        className
      )}
    >
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-serif text-3xl font-bold md:text-4xl">{title}</h2>
        {description && (
          <p
            className={cn(
              "mx-auto mt-4 max-w-2xl text-lg",
              isPrimary ? "text-primary-foreground/90" : "text-muted-foreground"
            )}
          >
            {description}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {buttons.map((btn) => (
            <Button
              key={btn.href}
              asChild
              size="lg"
              variant={
                btn.variant ??
                (isPrimary ? "secondary" : "default")
              }
            >
              <Link
                href={btn.href}
                target={btn.external ? "_blank" : undefined}
                rel={btn.external ? "noopener noreferrer" : undefined}
              >
                {btn.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  )
}
