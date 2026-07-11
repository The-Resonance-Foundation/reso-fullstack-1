"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLink, LogOut, Menu, Music } from "lucide-react"
import { logout } from "@/app/actions/auth"
import { NotificationBell } from "@/components/portal/notification-bell"
import {
  PortalNav,
  pageTitleFromNav,
  type PortalNavFlags,
} from "@/components/portal/portal-nav"
import { ThemeToggle } from "@/components/portal/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { initials } from "@/lib/utils"
import { routes } from "@/lib/routes"
import type { Notification } from "@/types/database"

type PortalHeaderProps = {
  displayName: string
  email: string
  flags: PortalNavFlags
  notifications: Notification[]
  unreadCount: number
}

export function PortalHeader({
  displayName,
  email,
  flags,
  notifications,
  unreadCount,
}: PortalHeaderProps) {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [, startTransition] = useTransition()
  const title = pageTitleFromNav(flags, pathname)

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-6">
      {/* Mobile nav drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetHeader className="border-b border-sidebar-border px-4 py-3.5 text-left">
            <SheetTitle className="flex items-center gap-2.5 text-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Music className="h-4 w-4" aria-hidden />
              </span>
              <span className="leading-tight">
                <span className="block font-serif text-sm font-bold text-sidebar-foreground">
                  Resonance
                </span>
                <span className="block text-[11px] font-normal text-sidebar-foreground/60">
                  Member Portal
                </span>
              </span>
            </SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100%-4rem)] overflow-y-auto p-3">
            <PortalNav
              flags={flags}
              instanceId="mobile"
              onNavigate={() => setMobileNavOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <h1 className="min-w-0 flex-1 truncate font-serif text-lg font-semibold">
        {title}
      </h1>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="ml-1 rounded-full outline-none ring-ring transition-transform focus-visible:ring-2 active:scale-95"
            >
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback>{initials(displayName)}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-60">
            <DropdownMenuLabel className="font-normal">
              <span className="block truncate text-sm font-semibold">
                {displayName}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={routes.home} className="cursor-pointer">
                <ExternalLink aria-hidden />
                Back to website
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onSelect={() => {
                startTransition(async () => {
                  await logout()
                })
              }}
            >
              <LogOut aria-hidden />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
