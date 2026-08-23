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
  className,
}: CTABandProps) {
  return (
    <section className={cn("py-20 md:py-28", className)}>
      <div data-reveal="1" className="container mx-auto max-w-[900px] px-4 text-center">
        <h2 className="text-3xl leading-[1.1] tracking-[-0.02em] md:text-[clamp(36px,3.8vw,54px)]">
          {title}
        </h2>
        {description && (
          <p className="mx-auto mt-5 max-w-[620px] text-[17px] leading-[1.7] text-[var(--noc-neutral-300)]">
            {description}
          </p>
        )}
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          {buttons.map((btn, i) => (
            <Button
              key={btn.href}
              asChild
              size="lg"
              variant={i === 0 ? "default" : "outline"}
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
