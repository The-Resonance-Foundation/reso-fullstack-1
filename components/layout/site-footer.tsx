import Link from "next/link"
import { Heart, Mail, Music } from "lucide-react"
import { FacebookIcon, InstagramIcon } from "@/components/icons/social"
import { siteConfig } from "@/lib/config/site"
import { routes } from "@/lib/routes"

export function SiteFooter() {
  const { navigation, links, footerBlurb, footerQuote } = siteConfig
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border bg-foreground text-background">
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href={routes.home} className="flex items-center gap-2">
              <Music className="h-7 w-7" aria-hidden />
              <span className="font-serif text-lg font-bold">The Resonance Foundation</span>
            </Link>
            <p className="mt-4 text-sm text-background/70">{footerBlurb}</p>
            <p className="mt-4 font-serif text-sm italic text-background/85">
              &ldquo;{footerQuote}&rdquo;
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              {navigation.footerQuickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/70 transition-colors hover:text-background"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Get Started</h3>
            <ul className="mt-4 space-y-2">
              {navigation.footerGetStarted.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/70 transition-colors hover:text-background"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Connect</h3>
            <div className="mt-4 flex gap-3">
              <a
                href={links.social.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/10 transition-colors hover:bg-background/20"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a
                href={links.social.facebook.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/10 transition-colors hover:bg-background/20"
                aria-label="Facebook"
              >
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a
                href={links.email.mailto}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/10 transition-colors hover:bg-background/20"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
            <p className="mt-4 text-sm text-background/70">
              <a href={links.email.mailto} className="hover:text-background">
                {links.email.address}
              </a>
            </p>
            <p className="mt-2 text-sm text-background/60">
              <a
                href={links.social.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-background"
              >
                {links.social.instagram.handle}
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-5 text-sm text-background/60 md:flex-row">
          <p>&copy; {year} The Resonance Foundation. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3.5 w-3.5 fill-red-400 text-red-400" aria-hidden /> by
            student musicians
          </p>
        </div>
      </div>
    </footer>
  )
}
