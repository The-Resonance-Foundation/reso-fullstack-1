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
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthenticated={Boolean(session)} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
