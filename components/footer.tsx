import Link from "next/link"
import { Music, Instagram, Facebook, Mail, Heart } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { href: "/about", label: "About Us" },
    { href: "/programs", label: "Programs" },
    { href: "/get-involved", label: "Get Involved" },
    { href: "/donate", label: "Donate" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ]

  const getStarted = [
    { href: "https://forms.gle/UNAahk69T6tvsMnv5", label: "Become a Student", external: true },
    { href: "https://forms.gle/iFDMcXnbG1fY2pAu5", label: "Become a Tutor", external: true },
    { href: "https://www.paypal.com/donate/?hosted_button_id=Z4CWC99SLXFTU", label: "Make a Donation", external: true },
  ]

  const socialLinks = [
    {
      icon: Instagram,
      href: "https://www.instagram.com/resonancefoundationtx/",
      label: "Instagram",
    },
    {
      icon: Facebook,
      href: "https://www.facebook.com/profile.php?id=61559964582578",
      label: "Facebook",
    },
    {
      icon: Mail,
      href: "mailto:info@theresonancefoundation.org",
      label: "Email",
    },
  ]

  return (
    <footer className="bg-foreground text-background">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="relative">
                <Music className="h-8 w-8 text-background" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
              </div>
              <span className="font-serif text-xl font-bold text-background">
                The Resonance Foundation
              </span>
            </Link>

            <p className="text-background/70 mb-6 text-sm">
              Empowering young musicians by providing access to music education. 
              Run by passionate high school students.
            </p>

            <p className="font-serif italic text-background/80">
              &ldquo;Empowering Minds, Inspiring Change&rdquo;
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-background mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-background/70 hover:text-background transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get Started */}
          <div>
            <h3 className="font-semibold text-background mb-4">Get Started</h3>
            <ul className="space-y-3">
              {getStarted.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="text-background/70 hover:text-background transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-semibold text-background mb-4">Connect With Us</h3>
            
            <div className="flex gap-4 mb-6">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-background/10 rounded-lg flex items-center justify-center hover:bg-background/20 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5 text-background" />
                </Link>
              ))}
            </div>

            <div className="text-sm">
              <p className="text-background/70 mb-1">Email us at:</p>
              <Link
                href="mailto:info@theresonancefoundation.org"
                className="text-background hover:text-primary transition-colors"
              >
                info@theresonancefoundation.org
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-background/60 text-sm text-center md:text-left">
              &copy; {currentYear} The Resonance Foundation. All rights reserved.
            </p>

            <p className="text-background/60 text-sm flex items-center gap-1">
              Made with <Heart className="h-4 w-4 text-red-400 fill-red-400" /> by student musicians
            </p>
          </div>
        </div>
      </div>

      {/* Musical Staff Decoration */}
      <div className="h-1 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50" />
    </footer>
  )
}
