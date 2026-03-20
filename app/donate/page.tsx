import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { Heart, Music, Users, GraduationCap, DollarSign, ArrowRight } from "lucide-react"

export default function DonatePage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
              Support Music Education
            </h1>
            <p className="text-xl text-muted-foreground">
              Your generosity helps us provide affordable music education to students who need it most.
            </p>
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
                Make a Difference Today
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Every donation, no matter the size, helps us continue our mission of making music 
                education accessible to all. Your contribution directly supports:
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Scholarships</h3>
                    <p className="text-muted-foreground">Financial aid for students who cannot afford lessons</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Music className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Instruments & Equipment</h3>
                    <p className="text-muted-foreground">Providing instruments for students who do not have access</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Community Programs</h3>
                    <p className="text-muted-foreground">Performances and events that bring music to the community</p>
                  </div>
                </li>
              </ul>
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <DollarSign className="h-8 w-8" />
                    <div>
                      <div className="text-2xl font-bold">$1000s Raised</div>
                      <div className="opacity-80">For music education initiatives</div>
                    </div>
                  </div>
                  <Button asChild variant="secondary" size="lg" className="w-full">
                    <Link href="https://www.paypal.com/donate/?hosted_button_id=Z4CWC99SLXFTU" target="_blank" rel="noopener noreferrer">
                      Donate via PayPal <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09848-5XuRGsfcpUWk3AQvzY3IWdjFbEsI6w.webp"
                alt="Tutor teaching flute to young student"
                width={600}
                height={400}
                className="rounded-2xl shadow-xl object-cover w-full"
              />
              <div className="grid grid-cols-2 gap-4">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09965-0wXmH5YN3W3nSgb9NuacCtmel6aDyP.webp"
                  alt="Young girl trying tuba"
                  width={280}
                  height={200}
                  className="rounded-xl object-cover h-40 w-full"
                />
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09888-N6vLUyfO892IVDwz8YDPn0hgWpMgve.webp"
                  alt="Saxophone lesson"
                  width={280}
                  height={200}
                  className="rounded-xl object-cover h-40 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center text-foreground mb-12">
            Your Impact
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="text-4xl font-bold text-primary mb-2">$10</div>
                <CardDescription className="text-base">
                  Provides one group lesson for a student
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="text-4xl font-bold text-primary mb-2">$50</div>
                <CardDescription className="text-base">
                  Sponsors a student for a month of lessons
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="text-4xl font-bold text-primary mb-2">$200</div>
                <CardDescription className="text-base">
                  Helps fund a community performance event
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Other Ways to Help */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
            Other Ways to Support
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Cannot donate? There are still many ways you can help support music education in our community.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="outline">
              <Link href="/get-involved">Become a Tutor</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="mailto:info@theresonancefoundation.org">Partner With Us</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="https://www.instagram.com/resonancefoundationtx/" target="_blank" rel="noopener noreferrer">
                Spread the Word
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
