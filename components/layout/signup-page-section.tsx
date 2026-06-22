import { cn } from "@/lib/utils"

type SignupPageSectionProps = {
  children: React.ReactNode
  className?: string
}

/** Centers signup cards below the fixed marketing header with room to scroll. */
export function SignupPageSection({ children, className }: SignupPageSectionProps) {
  return (
    <section
      className={cn(
        "container mx-auto w-full max-w-lg px-4 pt-28 pb-20 md:pt-32 md:pb-24",
        className
      )}
    >
      {children}
    </section>
  )
}
