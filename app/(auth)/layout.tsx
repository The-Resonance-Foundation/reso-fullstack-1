import Link from "next/link"
import { Music } from "lucide-react"
import { AuroraBackground } from "@/components/portal/aurora-background"
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
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[11px] bg-primary text-primary-foreground">
            <Music className="h-4.5 w-4.5" aria-hidden />
          </span>
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
