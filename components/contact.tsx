import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail, Instagram, Facebook, MapPin, Clock, Music } from "lucide-react"

export function Contact() {
  const contactMethods = [
    {
      icon: Mail,
      label: "Email Us",
      value: "info@theresonancefoundation.org",
      href: "mailto:info@theresonancefoundation.org",
      description: "We respond within 24-48 hours",
    },
    {
      icon: Instagram,
      label: "Instagram",
      value: "@theresonancefoundation._",
      href: "https://www.instagram.com/theresonancefoundation._/",
      description: "Follow us for updates and performances",
    },
    {
      icon: Facebook,
      label: "Facebook",
      value: "The Resonance Foundation",
      href: "https://www.facebook.com/people/The-Resonance-Foundation/61567109245575/",
      description: "Connect with our community",
    },
  ]

  return (
    <section id="contact" className="py-20 md:py-28 bg-card relative overflow-hidden">
      {/* Musical Staff Lines */}
      <div className="absolute inset-0 flex flex-col justify-center gap-8 opacity-5 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-full h-px bg-foreground" />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-4">
            <span className="w-8 h-px bg-primary" />
            Contact Us
            <span className="w-8 h-px bg-primary" />
          </div>

          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
            Let&apos;s Make{" "}
            <span className="text-primary">Music Together</span>
          </h2>

          <p className="text-lg text-muted-foreground text-pretty">
            Have questions about our programs? Want to volunteer or partner with us? 
            We&apos;d love to hear from you!
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {contactMethods.map((method) => (
            <Link
              key={method.label}
              href={method.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 bg-background rounded-2xl border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 text-center"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <method.icon className="h-7 w-7 text-primary" />
              </div>

              <h3 className="font-semibold text-foreground mb-1">
                {method.label}
              </h3>

              <p className="text-primary font-medium mb-2 text-sm">
                {method.value}
              </p>

              <p className="text-muted-foreground text-sm">
                {method.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5 text-primary" />
                <span>Flexible scheduling</span>
              </div>
              <div className="w-px h-5 bg-border" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Virtual & In-person lessons</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Interested in performing with us? Reach out via email to discuss opportunities!
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="mailto:info@theresonancefoundation.org">
                  <Music className="mr-2 h-4 w-4" />
                  Get in Touch
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
