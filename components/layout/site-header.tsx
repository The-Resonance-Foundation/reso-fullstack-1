"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Music } from "lucide-react"
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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-20">
        <Link href={routes.home} className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Music className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <span className="font-serif text-sm font-bold leading-tight text-foreground sm:text-lg md:text-xl">
            The Resonance Foundation
          </span>
        </Link>

        <nav className="hidden items-center gap-5 xl:gap-6 lg:flex" aria-label="Main">
          {navigation.primaryNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
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
          <SheetContent>
            <SheetHeader>
              <SheetTitle className="font-serif text-left">Menu</SheetTitle>
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
