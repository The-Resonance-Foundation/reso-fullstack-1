import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { EventDetailPanel } from "@/components/portal/events-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { canManageEvents, canAccessPortalFeatures } from "@/lib/auth/dal"
import { getEventWithMeta } from "@/lib/data/phase23"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Event",
  description: "Event details and RSVP.",
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [hasRole, canManage] = await Promise.all([
    canAccessPortalFeatures(),
    canManageEvents(),
  ])

  if (!hasRole) redirect("/dashboard")

  const event = await getEventWithMeta(id)
  if (!event) notFound()

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Button asChild variant="outline" size="sm" className="animate-fade-up">
        <Link href={routes.portal.events}>
          <ArrowLeft aria-hidden />
          Back to events
        </Link>
      </Button>
      <Card className="animate-fade-up overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary to-accent" aria-hidden />
        <CardContent className="pt-6">
          <EventDetailPanel event={event} canManage={canManage} />
        </CardContent>
      </Card>
    </div>
  )
}
