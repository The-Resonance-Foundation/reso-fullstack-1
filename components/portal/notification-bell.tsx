"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Bell } from "lucide-react"
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications"
import { Button } from "@/components/ui/button"
import type { Notification } from "@/types/database"

type NotificationBellProps = {
  notifications: Notification[]
  unreadCount: number
}

export function NotificationBell({ notifications, unreadCount }: NotificationBellProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleMarkRead(id: string, linkPath: string | null) {
    const formData = new FormData()
    formData.set("id", id)
    startTransition(async () => {
      await markNotificationRead(undefined, formData)
      router.refresh()
      if (linkPath) router.push(linkPath)
    })
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead()
      router.refresh()
    })
  }

  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center">
        <span className="relative inline-flex">
          <Bell className="h-5 w-5 text-muted-foreground" aria-hidden />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </span>
        <span className="sr-only">Notifications</span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-80 rounded-md border bg-card p-2 shadow-lg">
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-sm font-medium">Notifications</p>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              disabled={pending}
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          ) : null}
        </div>
        <ul className="max-h-80 space-y-1 overflow-y-auto">
          {notifications.length ? (
            notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted ${
                    n.read_at ? "text-muted-foreground" : "font-medium"
                  }`}
                  disabled={pending}
                  onClick={() => handleMarkRead(n.id, n.link_path)}
                >
                  <p>{n.title}</p>
                  {n.body ? (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {n.body}
                    </p>
                  ) : null}
                </button>
              </li>
            ))
          ) : (
            <li className="px-2 py-4 text-sm text-muted-foreground">No notifications yet.</li>
          )}
        </ul>
      </div>
    </details>
  )
}
