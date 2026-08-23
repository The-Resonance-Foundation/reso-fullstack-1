import Link from "next/link"
import { Heart, Mail, Music } from "lucide-react"
import { FacebookIcon, InstagramIcon } from "@/components/icons/social"
import { siteConfig } from "@/lib/config/site"
import { routes } from "@/lib/routes"

export function SiteFooter() {
  const { navigation, links, footerBlurb, footerQuote } = siteConfig
  const year = new Date().getFullYear()

  return (
    <footer className="relative z-[1] mt-auto border-t border-border bg-background text-foreground">
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href={routes.home} className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Music className="h-5 w-5 text-primary" aria-hidden />
              </span>
              <span className="text-base font-medium">The Resonance Foundation</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">{footerBlurb}</p>
            <p className="mt-4 text-sm italic text-[var(--noc-accent-200)]">
              &ldquo;{footerQuote}&rdquo;
            </p>
          </div>

          <div>
            <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.2em] text-[var(--noc-accent-300)]">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              {navigation.footerQuickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-[var(--noc-accent-200)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.2em] text-[var(--noc-accent-300)]">Get Started</h3>
            <ul className="mt-4 space-y-2">
              {navigation.footerGetStarted.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-[var(--noc-accent-200)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.2em] text-[var(--noc-accent-300)]">Connect</h3>
            <div className="mt-4 flex gap-3">
              <a
                href={links.social.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-[var(--noc-accent-200)]"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a
                href={links.social.facebook.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-[var(--noc-accent-200)]"
                aria-label="Facebook"
              >
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a
                href={links.email.mailto}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-[var(--noc-accent-200)]"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              <a href={links.email.mailto} className="hover:text-[var(--noc-accent-200)]">
                {links.email.address}
              </a>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              <a
                href={links.social.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--noc-accent-200)]"
              >
                {links.social.instagram.handle}
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-5 text-sm text-muted-foreground md:flex-row">
          <p>&copy; {year} The Resonance Foundation. All rights reserved.</p>
          <p className="flex items-center gap-3">
            <Link href={routes.privacy} className="transition-colors hover:text-[var(--noc-accent-200)]">
              Privacy
            </Link>
            <Link href={routes.terms} className="transition-colors hover:text-[var(--noc-accent-200)]">
              Terms
            </Link>
          </p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3.5 w-3.5 fill-red-400 text-red-400" aria-hidden /> by
            student musicians
          </p>
        </div>
      </div>
    </footer>
  )
}
