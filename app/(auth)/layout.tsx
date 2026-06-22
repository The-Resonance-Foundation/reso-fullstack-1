import Link from "next/link"
import { Music } from "lucide-react"
import { routes } from "@/lib/routes"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border px-4 py-4">
        <Link href={routes.home} className="inline-flex items-center gap-2">
          <Music className="h-6 w-6 text-primary" />
          <span className="font-serif font-bold">The Resonance Foundation</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  )
}
