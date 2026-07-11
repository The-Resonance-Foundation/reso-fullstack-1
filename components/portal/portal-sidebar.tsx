"use client"

import Link from "next/link"
import { Music } from "lucide-react"
import { PortalNav, type PortalNavFlags } from "@/components/portal/portal-nav"
import { ScrollArea } from "@/components/ui/scroll-area"
import { routes } from "@/lib/routes"

export type RoleChip = {
  id: string
  label: string
  chapter: string | null
}

type PortalSidebarProps = {
  flags: PortalNavFlags
  roleChips: RoleChip[]
}

export function PortalSidebar({ flags, roleChips }: PortalSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <Link
        href={routes.portal.dashboard}
        className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Music className="h-5 w-5" aria-hidden />
        </span>
        <span className="leading-tight">
          <span className="block font-serif text-sm font-bold text-sidebar-foreground">
            Resonance
          </span>
          <span className="block text-[11px] text-sidebar-foreground/60">
            Member Portal
          </span>
        </span>
      </Link>

      <ScrollArea className="flex-1">
        <div className="p-3">
          <PortalNav flags={flags} instanceId="desktop" />
        </div>
      </ScrollArea>

      {roleChips.length > 0 ? (
        <div className="shrink-0 border-t border-sidebar-border p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            Your roles
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {roleChips.map((chip) => (
              <li
                key={chip.id}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-sidebar-border bg-sidebar-accent/60 px-2.5 py-1 text-[11px] font-medium text-sidebar-foreground"
                title={chip.chapter ? `${chip.label} · ${chip.chapter}` : chip.label}
              >
                <span className="truncate">{chip.label}</span>
                {chip.chapter ? (
                  <span className="shrink-0 text-sidebar-foreground/55">
                    · {chip.chapter}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  )
}
