"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Bell, CheckCheck, Inbox } from "lucide-react"
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, timeAgo } from "@/lib/utils"
import type { Notification } from "@/types/database"

type NotificationBellProps = {
  notifications: Notification[]
  unreadCount: number
}

export function NotificationBell({ notifications, unreadCount }: NotificationBellProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleMarkRead(id: string, linkPath: string | null, alreadyRead: boolean) {
    startTransition(async () => {
      if (!alreadyRead) {
        const formData = new FormData()
        formData.set("id", id)
        await markNotificationRead(undefined, formData)
      }
      setOpen(false)
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            unreadCount > 0
              ? `Notifications — ${unreadCount} unread`
              : "Notifications"
          }
          className="relative"
        >
          <Bell className="h-5 w-5" aria-hidden />
          {unreadCount > 0 ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-96 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto gap-1.5 px-2 py-1 text-xs text-muted-foreground"
              disabled={pending}
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              Mark all read
            </Button>
          ) : null}
        </div>
        {notifications.length ? (
          <ScrollArea className="h-[min(24rem,60vh)]">
            <ul className="p-1.5">
              {notifications.map((n, index) => (
                <motion.li
                  key={n.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.2 }}
                >
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                      pending && "pointer-events-none opacity-60"
                    )}
                    onClick={() => handleMarkRead(n.id, n.link_path, Boolean(n.read_at))}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        n.read_at ? "bg-transparent" : "bg-primary"
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate",
                          n.read_at ? "text-muted-foreground" : "font-medium"
                        )}
                      >
                        {n.title}
                      </span>
                      {n.body ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">
                          {n.body}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-[11px] text-muted-foreground/70">
                        {timeAgo(n.created_at)}
                      </span>
                    </span>
                  </button>
                </motion.li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-5 w-5 text-muted-foreground" aria-hidden />
            </span>
            <p className="text-sm font-medium">You&apos;re all caught up</p>
            <p className="text-xs text-muted-foreground">
              New activity will show up here.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
