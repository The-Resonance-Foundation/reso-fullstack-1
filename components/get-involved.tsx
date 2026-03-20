import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GraduationCap, Users, Briefcase, ArrowRight } from "lucide-react"

export function GetInvolved() {
  const opportunities = [
    {
      icon: GraduationCap,
      title: "Become a Student",
      description: "Ready to start your musical journey? Sign up to connect with one of our experienced tutors and begin learning your chosen instrument.",
      cta: "Apply Now",
      href: "https://forms.gle/UNAahk69T6tvsMnv5",
      highlight: true,
      disabled: false,
    },
    {
      icon: Users,
      title: "Become a Tutor",
      description: "Share your passion for music! Join our team of volunteer tutors and help inspire the next generation of musicians.",
      cta: "Apply to Tutor",
      href: "https://forms.gle/vZd9WBYuQaPwJHfS6",
      highlight: false,
      disabled: false,
    },
    {
      icon: Briefcase,
      title: "Officer Application",
      description: "Want to be part of our leadership team? Help us expand our mission and make a lasting impact on music education.",
      cta: "Applications Closed",
      href: "https://forms.gle/sRHomKNVNy2Vyx5V9",
      highlight: false,
      disabled: true,
    },
  ]

  return (
    <section id="get-involved" className="py-20 md:py-28 bg-card relative overflow-hidden">
      {/* Decorative Music Notes */}
      <div className="absolute top-20 left-10 text-primary/5 text-8xl rotate-12">♫</div>
      <div className="absolute bottom-20 right-10 text-primary/5 text-8xl -rotate-12">♪</div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-4">
            <span className="w-8 h-px bg-primary" />
            Get Involved
            <span className="w-8 h-px bg-primary" />
          </div>

          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
            Join Our{" "}
            <span className="text-primary">Musical Community</span>
          </h2>

          <p className="text-lg text-muted-foreground text-pretty">
            Whether you want to learn, teach, or lead, there&apos;s a place for you at The Resonance Foundation. 
            Join us in spreading the joy of music to young musicians everywhere.
          </p>
        </div>

        {/* Opportunities Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {opportunities.map((opp) => (
            <div
              key={opp.title}
              className={`relative p-8 rounded-2xl border transition-all duration-300 ${
                opp.highlight
                  ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20"
                  : "bg-background border-border hover:border-primary/30 hover:shadow-lg"
              }`}
            >
              {opp.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Start Here
                </div>
              )}

              <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 ${
                opp.highlight ? "bg-primary-foreground/20" : "bg-primary/10"
              }`}>
                <opp.icon className={`h-8 w-8 ${opp.highlight ? "" : "text-primary"}`} />
              </div>

              <h3 className="font-serif text-2xl font-bold mb-3">
                {opp.title}
              </h3>

              <p className={`mb-6 ${opp.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {opp.description}
              </p>

              {opp.disabled ? (
                <span className="inline-flex items-center gap-2 text-muted-foreground line-through cursor-not-allowed">
                  {opp.cta}
                  <ArrowRight className="h-4 w-4" />
                </span>
              ) : (
                <Button
                  asChild
                  variant={opp.highlight ? "secondary" : "outline"}
                  className={`w-full ${
                    opp.highlight
                      ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                      : "border-primary/30 hover:bg-primary/5"
                  }`}
                >
                  <Link href={opp.href} target="_blank" rel="noopener noreferrer">
                    {opp.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
