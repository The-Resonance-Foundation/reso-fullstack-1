import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { Mail, Instagram, Facebook, ArrowRight, Music } from "lucide-react"

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-muted-foreground">
              We would love to hear from you. Get in touch with The Resonance Foundation.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-serif font-bold text-foreground mb-8">
                Get in Touch
              </h2>
              
              <div className="space-y-6">
                {/* Email */}
                <Card>
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg mb-1">Email</h3>
                      <p className="text-muted-foreground mb-2">
                        For general inquiries, partnerships, or questions
                      </p>
                      <Link 
                        href="mailto:info@theresonancefoundation.org"
                        className="text-primary hover:underline font-medium"
                      >
                        info@theresonancefoundation.org
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Instagram */}
                <Card>
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Instagram className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg mb-1">Instagram</h3>
                      <p className="text-muted-foreground mb-2">
                        Follow us for updates, photos, and events
                      </p>
                      <Link 
                        href="https://www.instagram.com/resonancefoundationtx/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        @resonancefoundationtx
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Facebook */}
                <Card>
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Facebook className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg mb-1">Facebook</h3>
                      <p className="text-muted-foreground mb-2">
                        Connect with our community on Facebook
                      </p>
                      <Link 
                        href="https://www.facebook.com/profile.php?id=61559964582578"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        The Resonance Foundation
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-3xl font-serif font-bold text-foreground mb-8">
                Quick Actions
              </h2>
              
              <div className="space-y-4">
                <Card className="bg-primary text-primary-foreground">
                  <CardHeader>
                    <CardTitle>Become a Student</CardTitle>
                    <CardDescription className="text-primary-foreground/80">
                      Ready to start your musical journey?
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="secondary" className="w-full">
                      <Link href="https://forms.gle/UNAahk69T6tvsMnv5" target="_blank" rel="noopener noreferrer">
                        Sign Up Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Become a Tutor</CardTitle>
                    <CardDescription>
                      Share your musical knowledge with others
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full bg-primary hover:bg-primary/90">
                      <Link href="https://forms.gle/zhPzhZkDfQpQsgDF7" target="_blank" rel="noopener noreferrer">
                        Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Support Our Mission</CardTitle>
                    <CardDescription>
                      Help us make music education accessible
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/donate">
                        Donate <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-serif font-bold text-center text-foreground mb-12">
              Join Our Musical Community
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_8912-2fT7q44HWV149hpxvKPLW8mXrDaIHA.webp"
                alt="Ensemble performing"
                width={400}
                height={300}
                className="rounded-xl object-cover h-48 w-full"
              />
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09476-ER35I7HAWMvd2l6AcYelNxsRTewIFH.webp"
                alt="Flute ensemble"
                width={400}
                height={300}
                className="rounded-xl object-cover h-48 w-full"
              />
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_8921-nnZcC20Ec9Ja2ngaunY3LjjN4ceB4y.webp"
                alt="Resonance Foundation banner"
                width={400}
                height={300}
                className="rounded-xl object-cover h-48 w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
            Have Questions?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Check out our FAQ page for answers to common questions about lessons, tutoring, 
            donations, and more.
          </p>
          <Button asChild size="lg" variant="outline">
            <Link href="/faq">
              View FAQ <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  )
}
