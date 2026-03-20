import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { Music, Users, Heart, Target, Lightbulb, Award } from "lucide-react"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
              About The Resonance Foundation
            </h1>
            <p className="text-xl text-muted-foreground">
              Empowering Minds, Inspiring Change Through Music Education
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                The Resonance Foundation is a nonprofit organization dedicated to offering low-cost music education 
                to students, fostering a love for music while helping them improve their skills.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                We believe that every child deserves access to quality music education, regardless of their 
                financial situation. Through our dedicated team of student tutors and community partnerships, 
                we are making music education accessible to all.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">Accessible Education</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">Community Focused</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">Student-Led</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">Quality Instruction</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09907-Idh9EpkBMGOIsMUFO0ODf6zRiWII2U.webp"
                alt="Tutor working with a young student"
                width={600}
                height={450}
                className="rounded-2xl shadow-xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12">
            Our Impact
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: "50+", label: "Dedicated Tutors" },
              { icon: Music, value: "1,000+", label: "Lives Impacted" },
              { icon: Heart, value: "$1000s", label: "Raised for Music Education" },
              { icon: Award, value: "30+", label: "Leadership Officers" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-10 w-10 mx-auto mb-4 opacity-80" />
                <div className="text-4xl md:text-5xl font-serif font-bold mb-2">{stat.value}</div>
                <div className="text-sm opacity-80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center text-foreground mb-12">
            What We Do
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Music className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground mb-4">Music Lessons</h3>
                <p className="text-muted-foreground">
                  We provide affordable music lessons in woodwind, brass, string, and vocal instruction 
                  to students of all skill levels.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground mb-4">Community Events</h3>
                <p className="text-muted-foreground">
                  We organize performances and events that bring music to the community and provide 
                  students with real-world performance experience.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground mb-4">Fundraising</h3>
                <p className="text-muted-foreground">
                  We raise funds to support music education initiatives and ensure that financial 
                  barriers never prevent a child from learning music.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center text-foreground mb-12">
            Our Community in Action
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09848-5XuRGsfcpUWk3AQvzY3IWdjFbEsI6w.webp"
              alt="Flute lesson with young student"
              width={400}
              height={300}
              className="rounded-xl object-cover h-64 w-full"
            />
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09995-TA2CQglZ8kX2RiFhguGsS0c8iH9cVj.webp"
              alt="Adult playing tuba at community event"
              width={400}
              height={300}
              className="rounded-xl object-cover h-64 w-full"
            />
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC01008-JpNIqTb9BmTKnOQLThNoAqUdlVkyWf.webp"
              alt="Young student at music event"
              width={400}
              height={300}
              className="rounded-xl object-cover h-64 w-full"
            />
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09888-N6vLUyfO892IVDwz8YDPn0hgWpMgve.webp"
              alt="Student learning saxophone"
              width={400}
              height={300}
              className="rounded-xl object-cover h-64 w-full"
            />
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09965-0wXmH5YN3W3nSgb9NuacCtmel6aDyP.webp"
              alt="Young girl trying tuba"
              width={400}
              height={300}
              className="rounded-xl object-cover h-64 w-full"
            />
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_8912-2fT7q44HWV149hpxvKPLW8mXrDaIHA.webp"
              alt="Ensemble performing at mall"
              width={400}
              height={300}
              className="rounded-xl object-cover h-64 w-full"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
            Join Our Mission
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you want to learn, teach, or support music education, there is a place for you 
            at The Resonance Foundation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link href="/get-involved">Get Involved</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/donate">Support Us</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
