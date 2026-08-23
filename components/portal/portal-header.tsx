"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ChevronDown, ExternalLink, LogOut, Menu } from "lucide-react"
import { logout } from "@/app/actions/auth"
import { BrandMark } from "@/components/portal/aurora-background"
import { NotificationBell } from "@/components/portal/notification-bell"
import { PortalNav, type PortalNavFlags } from "@/components/portal/portal-nav"
import { PortalSearch } from "@/components/portal/portal-search"
import type { RoleChip } from "@/components/portal/portal-sidebar"
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
  roleChips: RoleChip[]
  badges?: Record<string, number>
  notifications: Notification[]
  unreadCount: number
}

export function PortalHeader({
  displayName,
  email,
  flags,
  roleChips,
  badges,
  notifications,
  unreadCount,
}: PortalHeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [, startTransition] = useTransition()

  const roleSummary = roleChips
    .slice(0, 2)
    .map((chip) => chip.label.split(" ")[0])
    .join(" · ")
  const chapter = roleChips.find((chip) => chip.chapter)?.chapter

  return (
    <header className="flex h-[60px] shrink-0 items-center gap-3.5 border-b border-border px-4 md:px-5">
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
        <SheetContent side="left" className="dark portal-aurora w-72 border-border bg-[#181209] p-0">
          <SheetHeader className="border-b border-border px-4 py-3.5 text-left">
            <SheetTitle className="flex items-center gap-2.5 text-sm">
              <BrandMark size={32} />
              <span className="leading-tight">
                <span className="block font-serif text-sm font-bold text-foreground">
                  Resonance
                </span>
                <span className="block text-[11px] font-normal text-muted-foreground">
                  Member Portal
                </span>
              </span>
            </SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100%-4rem)] overflow-y-auto p-3">
            <PortalNav
              flags={flags}
              instanceId="mobile"
              badges={badges}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 items-center">
        <PortalSearch flags={flags} />
      </div>

      <div className="flex items-center gap-1.5">
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 outline-none ring-ring transition-colors hover:bg-[rgba(255,242,226,0.06)] focus-visible:ring-2 active:scale-[.98]"
            >
              <Avatar className="h-8 w-8 border-0">
                <AvatarFallback className="bg-gradient-to-br from-[var(--acc-hi)] to-[var(--acc-lo)] text-xs font-bold text-[#2A1706]">
                  {initials(displayName)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left sm:block">
                <span className="block max-w-[140px] truncate text-[13px] font-semibold leading-tight">
                  {displayName}
                </span>
                <span className="block max-w-[140px] truncate text-[10.5px] leading-tight text-muted-foreground">
                  {roleSummary || "Member"}
                  {chapter ? ` · ${chapter}` : ""}
                </span>
              </span>
              <ChevronDown
                className="hidden h-3.5 w-3.5 text-muted-foreground sm:block"
                aria-hidden
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-60">
            <DropdownMenuLabel className="font-normal">
              <span className="block truncate text-sm font-semibold">{displayName}</span>
              <span className="block truncate text-xs text-muted-foreground">{email}</span>
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
