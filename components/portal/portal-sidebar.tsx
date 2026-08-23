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

const ROLE_DOTS = ["var(--acc-hi, #F8B269)", "#8FE3A8", "#6CBDE6", "#B3A1FF"]

type PortalSidebarProps = {
  flags: PortalNavFlags
  roleChips: RoleChip[]
  badges?: Record<string, number>
}

export function PortalSidebar({ flags, roleChips, badges }: PortalSidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-gradient-to-b from-[rgba(255,242,226,0.035)] to-[rgba(255,242,226,0.01)] lg:flex">
      <Link
        href={routes.portal.dashboard}
        className="flex shrink-0 items-center gap-3 px-4 pb-3 pt-5"
      >
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[13px] bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(214,116,28,.35)]">
          <Music className="h-5 w-5" aria-hidden />
        </span>
        <span className="leading-tight">
          <span className="block font-serif text-[16px] font-bold tracking-[.01em] text-sidebar-foreground">
            Resonance
          </span>
          <span className="mt-0.5 block text-[11px] tracking-[.04em] text-muted-foreground">
            Member Portal
          </span>
        </span>
      </Link>

      <ScrollArea className="min-h-0 flex-1">
        <div className="px-3 pb-3 pt-1">
          <PortalNav flags={flags} instanceId="desktop" badges={badges} />
        </div>
      </ScrollArea>

      {roleChips.length > 0 ? (
        <div className="shrink-0 border-t border-sidebar-border px-4 py-4">
          <p className="text-[10.5px] font-bold uppercase tracking-[.14em] text-foreground/55">
            Your roles
          </p>
          <ul className="mt-2.5 flex flex-col gap-2">
            {roleChips.map((chip, i) => (
              <li
                key={chip.id}
                className="flex items-center gap-2.5 text-[12.5px] font-medium text-[#DAD0C2]"
              >
                <span
                  className="h-[5px] w-[5px] flex-none rounded-full"
                  style={{ background: ROLE_DOTS[i % ROLE_DOTS.length] }}
                />
                <span className="truncate">{chip.label}</span>
                {chip.chapter ? (
                  <span className="shrink-0 font-normal text-muted-foreground">
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
