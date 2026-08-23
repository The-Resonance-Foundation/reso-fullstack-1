import Link from "next/link"
import { AuroraBackground, BrandMark } from "@/components/portal/aurora-background"
import { routes } from "@/lib/routes"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Auth shares the portal's aurora glass look — it's the door into it.
    <div className="dark portal-aurora relative flex min-h-screen flex-col bg-background text-foreground">
      <AuroraBackground />
      <header className="relative z-10 px-5 py-4">
        <Link href={routes.home} className="inline-flex items-center gap-2.5">
          <BrandMark size={34} />
          <span className="font-serif text-[15px] font-bold tracking-[.01em]">
            The Resonance Foundation
          </span>
        </Link>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  )
}
