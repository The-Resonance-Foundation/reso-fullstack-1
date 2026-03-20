import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { GraduationCap, Users, Music, Briefcase, Heart, ArrowRight } from "lucide-react"

export default function GetInvolvedPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
              Get Involved
            </h1>
            <p className="text-xl text-muted-foreground">
              There are many ways to join our mission of making music education accessible to all.
            </p>
          </div>
        </div>
      </section>

      {/* Ways to Get Involved */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Student */}
            <Card className="overflow-hidden">
              <div className="relative h-48">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC00055-cr2JqUSW9ib52oCw5jNXVb8uFQ6cXQ.webp"
                  alt="Student learning flute"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              </div>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-serif">Become a Student</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Start your musical journey with affordable lessons from dedicated tutors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">-</span>
                    <span>Lessons available for all skill levels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">-</span>
                    <span>Woodwind, brass, string, and vocal instruction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">-</span>
                    <span>Group and individual lessons available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">-</span>
                    <span>Financial aid available</span>
                  </li>
                </ul>
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link href="https://forms.gle/UNAahk69T6tvsMnv5" target="_blank" rel="noopener noreferrer">
                    Sign Up as Student <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Tutor */}
            <Card className="overflow-hidden">
              <div className="relative h-48">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09848-5XuRGsfcpUWk3AQvzY3IWdjFbEsI6w.webp"
                  alt="Tutor teaching student"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              </div>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-serif">Become a Tutor</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Share your musical knowledge and make a difference in young lives.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">-</span>
                    <span>High school or college students welcome</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">-</span>
                    <span>No prior teaching experience required</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">-</span>
                    <span>Counts as volunteer hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">-</span>
                    <span>Flexible scheduling</span>
                  </li>
                </ul>
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link href="https://forms.gle/iFDMcXnbG1fY2pAu5" target="_blank" rel="noopener noreferrer">
                    Apply as Tutor <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Perform */}
            <Card className="overflow-hidden">
              <div className="relative h-48">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09671-rSlrlSNwyh5nW9vU0C8ZzP3lkNw9zs.webp"
                  alt="Students performing"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              </div>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Music className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-serif">Perform With Us</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Showcase your talent at community events and help inspire others.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">-</span>
                    <span>Regular community performances</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">-</span>
                    <span>Ensemble and solo opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">-</span>
                    <span>Build confidence and stage presence</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">-</span>
                    <span>Help raise awareness for music education</span>
                  </li>
                </ul>
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link href="mailto:info@theresonancefoundation.org">
                    Inquire About Performing <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Officer */}
            <Card className="overflow-hidden">
              <div className="relative h-48">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09568-3Tl1Hqb8xMIzXLbfVLGsMY2afd2Oiv.webp"
                  alt="Leadership team member"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              </div>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-serif">Join Leadership</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Help lead and grow The Resonance Foundation as an officer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">-</span>
                    <span>Develop leadership and organizational skills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">-</span>
                    <span>Help shape the future of the organization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">-</span>
                    <span>Coordinate events and programs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">-</span>
                    <span>Great for college applications</span>
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full" disabled>
                  <span className="line-through">Applications Closed</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Photo Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center text-foreground mb-12">
            Our Team in Action
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09907-Idh9EpkBMGOIsMUFO0ODf6zRiWII2U.webp"
              alt="Tutor helping student"
              width={300}
              height={200}
              className="rounded-xl object-cover h-48 w-full"
            />
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09965-0wXmH5YN3W3nSgb9NuacCtmel6aDyP.webp"
              alt="Student trying tuba"
              width={300}
              height={200}
              className="rounded-xl object-cover h-48 w-full"
            />
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09888-N6vLUyfO892IVDwz8YDPn0hgWpMgve.webp"
              alt="Saxophone lesson"
              width={300}
              height={200}
              className="rounded-xl object-cover h-48 w-full"
            />
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC01008-JpNIqTb9BmTKnOQLThNoAqUdlVkyWf.webp"
              alt="Young student"
              width={300}
              height={200}
              className="rounded-xl object-cover h-48 w-full"
            />
          </div>
        </div>
      </section>

      {/* Donate CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Heart className="h-8 w-8" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold">
              Support Our Mission
            </h2>
          </div>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Your donation helps us provide affordable music education to students who might otherwise 
            not have access. Every contribution makes a difference.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/donate">
              Donate Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  )
}
