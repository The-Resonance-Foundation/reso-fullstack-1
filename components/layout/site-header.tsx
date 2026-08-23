"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { siteConfig } from "@/lib/config/site"
import { routes } from "@/lib/routes"

type SiteHeaderProps = {
  isAuthenticated?: boolean
}

export function SiteHeader({ isAuthenticated = false }: SiteHeaderProps) {
  const [open, setOpen] = useState(false)
  const { navigation } = siteConfig

  const accountHref = isAuthenticated ? routes.portal.dashboard : routes.auth.login
  const accountLabel = isAuthenticated ? "Dashboard" : "Log In"

  return (
    <header
      id="navBar"
      // Transparent at the top; NocturneEffects paints the glass treatment
      // (background, blur, border) once the page scrolls past 50px.
      className="fixed inset-x-0 top-0.5 z-50 border-b border-transparent transition-[background,border-color,backdrop-filter] duration-300"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-[70px]">
        <Link href={routes.home} className="group flex items-center gap-3">
          <span className="relative inline-flex h-[26px] w-[26px] items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-primary opacity-90" />
            <span className="absolute inset-[5px] rounded-full border border-[var(--noc-accent-600)]" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          <span className="text-sm font-medium leading-tight tracking-[0.01em] text-foreground transition-colors group-hover:text-[var(--noc-accent-200)] sm:text-base md:text-[16.5px]">
            The Resonance Foundation
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {navigation.primaryNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-md px-3 py-2 text-[13.5px] font-medium text-[var(--noc-neutral-300)] transition-colors hover:bg-primary/10 hover:text-[var(--noc-accent-200)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href={accountHref}>{accountLabel}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={routes.join} title={navigation.secondaryCta.title}>
              {navigation.secondaryCta.label}
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={routes.enroll}>{navigation.ctaButton.label}</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          {/* Radix portals escape the theme wrapper — re-scope the sheet. */}
          <SheetContent className="marketing-nocturne border-border bg-background text-foreground">
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-4" aria-label="Mobile">
              {navigation.primaryNav.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-lg font-medium text-foreground"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={accountHref}
                className="text-lg font-medium text-muted-foreground"
                onClick={() => setOpen(false)}
              >
                {accountLabel}
              </Link>
              <Button asChild variant="outline" className="mt-2">
                <Link href={routes.join} onClick={() => setOpen(false)}>
                  {navigation.secondaryCta.label}
                </Link>
              </Button>
              <Button asChild className="mt-2">
                <Link href={routes.enroll} onClick={() => setOpen(false)}>
                  {navigation.ctaButton.label}
                </Link>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
