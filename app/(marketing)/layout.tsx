import { NocturneEffects } from "@/components/marketing/nocturne-effects"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { getSession } from "@/lib/auth/dal"

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return (
    // Marketing pages run the Nocturne theme (deep indigo, blurple accent)
    // regardless of the portal theme toggle.
    <div className="marketing-nocturne relative flex min-h-screen flex-col overflow-x-clip bg-background text-foreground">
      {/* Resonance wave field — the WebGL renderer mounts its canvas here */}
      <div
        id="noc-field"
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
      />
      {/* Scroll progress */}
      <div className="fixed inset-x-0 top-0 z-[90] h-0.5 bg-foreground/5">
        <div
          id="noc-progress"
          className="h-full w-0 bg-gradient-to-r from-[var(--noc-accent-700)] to-primary"
        />
      </div>
      <NocturneEffects />
      <SiteHeader isAuthenticated={Boolean(session)} />
      <main className="relative z-[1] flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
