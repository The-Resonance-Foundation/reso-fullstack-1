import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, Music, BookOpen, Users, Sparkles } from "lucide-react"

export function Donate() {
  const impactItems = [
    {
      icon: Music,
      text: "Provide instrument access to students in need",
    },
    {
      icon: BookOpen,
      text: "Supply sheet music and educational materials",
    },
    {
      icon: Users,
      text: "Fund community performances and recitals",
    },
    {
      icon: Sparkles,
      text: "Expand our tutoring programs to more students",
    },
  ]

  return (
    <section id="donate" className="py-20 md:py-28 bg-gradient-to-b from-secondary/30 to-background relative overflow-hidden">
      {/* Sound Wave Decoration */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-3xl p-8 md:p-12 border border-border shadow-xl relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-accent/5 rounded-full" />

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row gap-12 items-center">
                {/* Left Content */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-4">
                    <Heart className="h-4 w-4" />
                    Support Our Mission
                  </div>

                  <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
                    Your Donation Makes a{" "}
                    <span className="text-primary">Difference</span>
                  </h2>

                  <p className="text-muted-foreground mb-6 text-pretty">
                    Every contribution, no matter the size, helps us provide music education to young 
                    musicians who might not otherwise have access. Your generosity fuels our mission 
                    and helps us create lasting impact in our community.
                  </p>

                  <p className="text-muted-foreground mb-8 text-pretty">
                    As a student-run non-profit, we rely entirely on the kindness of donors like you. 
                    Your support helps us purchase instruments, hire professional musicians for masterclasses, 
                    and provide free lessons to students from underserved communities.
                  </p>

                  {/* Impact List */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {impactItems.map((item) => (
                      <div key={item.text} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <item.icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right CTA */}
                <div className="flex-shrink-0 w-full lg:w-auto">
                  <div className="bg-primary/5 rounded-2xl p-8 text-center border border-primary/10">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
                      <Heart className="h-10 w-10 text-primary-foreground" />
                    </div>

                    <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
                      Donate Today
                    </h3>

                    <p className="text-muted-foreground text-sm mb-6">
                      100% of donations go directly to music education programs
                    </p>

                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6"
                    >
                      <Link
                        href="https://www.paypal.com/ncp/payment/726ZAHDJS7HZW"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Heart className="mr-2 h-5 w-5" />
                        Make a Donation
                      </Link>
                    </Button>

                    <p className="text-xs text-muted-foreground mt-4">
                      Secure payment via PayPal
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
