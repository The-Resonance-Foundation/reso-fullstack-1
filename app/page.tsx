import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { Music, Users, Heart, Award, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      
      {/* Quick Stats */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: "30+", label: "Dedicated Tutors" },
              { icon: Music, value: "1,000+", label: "Lives Impacted" },
              { icon: Heart, value: "$1000s", label: "Raised for Music" },
              { icon: Award, value: "4", label: "Instrument Programs" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-8 w-8 mx-auto mb-3 opacity-80" />
                <div className="text-3xl md:text-4xl font-serif font-bold">{stat.value}</div>
                <div className="text-sm opacity-80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Image Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
                Empowering Young Musicians Through Accessible Education
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                The Resonance Foundation is a nonprofit organization dedicated to offering low-cost music education 
                to students, fostering a love for music while helping them improve their skills. We believe every 
                child deserves the opportunity to explore their musical potential.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                  <Link href="/about">
                    Learn More <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/programs">View Programs</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC00055-cr2JqUSW9ib52oCw5jNXVb8uFQ6cXQ.webp"
                alt="Student learning flute with tutor guidance"
                width={600}
                height={400}
                className="rounded-2xl shadow-xl object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-xl shadow-lg border border-border">
                <div className="text-2xl font-serif font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Student-Led Initiative</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              Our Music Programs
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We offer comprehensive instruction across four major instrument families, plus performance opportunities.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { name: "Woodwind", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09476-ER35I7HAWMvd2l6AcYelNxsRTewIFH.webp" },
              { name: "Brass", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09671-rSlrlSNwyh5nW9vU0C8ZzP3lkNw9zs.webp" },
              { name: "String", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09568-3Tl1Hqb8xMIzXLbfVLGsMY2afd2Oiv.webp" },
              { name: "Vocal", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_8912-2fT7q44HWV149hpxvKPLW8mXrDaIHA.webp" },
            ].map((program) => (
              <Card key={program.name} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={program.image}
                    alt={`${program.name} program`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-xl font-serif font-bold text-card">{program.name}</h3>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link href="/programs">
                Explore All Programs <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Performance Highlight */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 grid grid-cols-2 gap-4">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_8921-nnZcC20Ec9Ja2ngaunY3LjjN4ceB4y.webp"
                alt="Resonance Foundation banner at event"
                width={280}
                height={200}
                className="rounded-xl object-cover h-48 w-full"
              />
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09454-E8LBsThoFGVHAxXPOykfMzAJDO8uMe.webp"
                alt="Woodwind ensemble performing"
                width={280}
                height={200}
                className="rounded-xl object-cover h-48 w-full"
              />
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_8914-amMPZmjvuFjbRQtnTlTI24xNMadGnM.webp"
                alt="Clarinet section performing"
                width={280}
                height={200}
                className="rounded-xl object-cover h-48 w-full col-span-2"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
                Live Performances & Community Events
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                Our students regularly perform at community events, malls, and special occasions. 
                These performances provide valuable experience and help raise awareness for music education.
              </p>
              <Button asChild size="lg" variant="outline">
                <Link href="/get-involved">Get Involved</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
            Ready to Start Your Musical Journey?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Whether you want to learn an instrument, become a tutor, or support our mission, 
            there is a place for you at The Resonance Foundation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href="https://forms.gle/UNAahk69T6tvsMnv5" target="_blank" rel="noopener noreferrer">
                Become a Student
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link href="/donate">Support Our Mission</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
