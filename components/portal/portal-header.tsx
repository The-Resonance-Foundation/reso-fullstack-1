import Link from "next/link"
import { LogoutButton } from "@/components/portal/logout-button"
import { NotificationBell } from "@/components/portal/notification-bell"
import { routes } from "@/lib/routes"
import type { Notification } from "@/types/database"

type PortalHeaderProps = {
  displayName: string
  notifications: Notification[]
  unreadCount: number
}

export function PortalHeader({
  displayName,
  notifications,
  unreadCount,
}: PortalHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4">
      <Link href={routes.home} className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to website
      </Link>
      <div className="flex items-center gap-3">
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
        <span className="hidden text-sm text-muted-foreground sm:inline">{displayName}</span>
        <LogoutButton />
      </div>
    </header>
  )
}
