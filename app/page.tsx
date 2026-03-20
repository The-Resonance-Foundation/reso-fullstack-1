import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { Music, Users, Heart, Award, ArrowRight, Sparkles } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      
      {/* Quick Stats with Equalizer Effect */}
      <section className="py-16 bg-primary text-primary-foreground relative overflow-hidden">
        {/* Background Musical Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute left-10 top-1/2 -translate-y-1/2 flex gap-1 items-end h-16">
            {[40, 70, 50, 80, 60, 90, 45, 75].map((h, i) => (
              <div 
                key={i} 
                className="w-2 bg-primary-foreground rounded-full animate-equalizer"
                style={{ 
                  height: `${h}%`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
          <div className="absolute right-10 top-1/2 -translate-y-1/2 flex gap-1 items-end h-16">
            {[60, 80, 40, 70, 55, 85, 50, 65].map((h, i) => (
              <div 
                key={i} 
                className="w-2 bg-primary-foreground rounded-full animate-equalizer"
                style={{ 
                  height: `${h}%`,
                  animationDelay: `${i * 0.15}s`
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: "50+", label: "Dedicated Tutors" },
              { icon: Music, value: "1,000+", label: "Lives Impacted" },
              { icon: Heart, value: "$1000s", label: "Raised for Music" },
              { icon: Award, value: "30+", label: "Leadership Officers" },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <stat.icon className="h-8 w-8 opacity-90" />
                </div>
                <div className="text-3xl md:text-4xl font-serif font-bold">{stat.value}</div>
                <div className="text-sm opacity-80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Image Section with Musical Decorations */}
      <section className="py-24 relative overflow-hidden">
        {/* Decorative Sound Waves */}
        <div className="absolute top-0 left-0 w-full h-24 opacity-5">
          <svg viewBox="0 0 1200 100" preserveAspectRatio="none" className="w-full h-full fill-primary">
            <path d="M0,50 Q150,0 300,50 T600,50 T900,50 T1200,50 V100 H0 Z" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-primary mb-4">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wider">Our Mission</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6 text-balance">
                Empowering Young Musicians Through Accessible Education
              </h2>
              <p className="text-muted-foreground text-lg mb-6 text-pretty">
                The Resonance Foundation is a nonprofit organization dedicated to offering low-cost music education 
                to students, fostering a love for music while helping them improve their skills. We believe every 
                child deserves the opportunity to explore their musical potential.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 group">
                  <Link href="/about">
                    Learn More 
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="hover:bg-primary/5">
                  <Link href="/programs">View Programs</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/5 rounded-3xl -z-10" />
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
              {/* Floating Music Note */}
              <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl animate-float">
                ♪
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Preview with Enhanced Cards */}
      <section className="py-24 bg-gradient-to-b from-muted/50 to-background relative">
        {/* Decorative Musical Staff Lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
          {[20, 35, 50, 65, 80].map((top) => (
            <div key={top} className="absolute left-0 right-0 h-px bg-foreground" style={{ top: `${top}%` }} />
          ))}
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-primary mb-4">
              <Music className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">What We Offer</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4 text-balance">
              Our Music Programs
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
              We offer comprehensive instruction across four major instrument families, plus performance opportunities.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { name: "Woodwind", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09476-ER35I7HAWMvd2l6AcYelNxsRTewIFH.webp", desc: "Flute, Clarinet, Saxophone & more" },
              { name: "Brass", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09671-rSlrlSNwyh5nW9vU0C8ZzP3lkNw9zs.webp", desc: "Trumpet, Trombone, Tuba & more" },
              { name: "String", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09568-3Tl1Hqb8xMIzXLbfVLGsMY2afd2Oiv.webp", desc: "Guitar, Violin, Cello & more" },
              { name: "Vocal", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_8912-2fT7q44HWV149hpxvKPLW8mXrDaIHA.webp", desc: "Classical, Contemporary & Choral" },
            ].map((program) => (
              <Card key={program.name} className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/10">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={program.image}
                    alt={`${program.name} program`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-serif font-bold text-card mb-1">{program.name}</h3>
                    <p className="text-sm text-card/80">{program.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 group">
              <Link href="/programs">
                Explore All Programs 
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Performance Highlight */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_8921-nnZcC20Ec9Ja2ngaunY3LjjN4ceB4y.webp"
                    alt="Resonance Foundation banner at event"
                    width={280}
                    height={200}
                    className="rounded-xl object-cover h-48 w-full group-hover:shadow-lg transition-shadow"
                  />
                </div>
                <div className="relative group">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09454-E8LBsThoFGVHAxXPOykfMzAJDO8uMe.webp"
                    alt="Woodwind ensemble performing"
                    width={280}
                    height={200}
                    className="rounded-xl object-cover h-48 w-full group-hover:shadow-lg transition-shadow"
                  />
                </div>
                <div className="relative col-span-2 group">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_8914-amMPZmjvuFjbRQtnTlTI24xNMadGnM.webp"
                    alt="Clarinet section performing"
                    width={580}
                    height={200}
                    className="rounded-xl object-cover h-48 w-full group-hover:shadow-lg transition-shadow"
                  />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 text-primary mb-4">
                <Music className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wider">Community Impact</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6 text-balance">
                Live Performances & Community Events
              </h2>
              <p className="text-muted-foreground text-lg mb-6 text-pretty">
                Our students regularly perform at community events, malls, senior centers, and special occasions. 
                These performances provide valuable experience and help raise awareness for music education.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" variant="outline" className="hover:bg-primary/5 group">
                  <Link href="/get-involved">
                    Get Involved
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Enhanced Design */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[
            { left: 5, top: 20, size: 48 },
            { left: 95, top: 30, size: 36 },
            { left: 15, top: 70, size: 40 },
            { left: 85, top: 75, size: 32 },
          ].map((note, i) => (
            <div
              key={i}
              className="absolute text-primary-foreground/10 animate-float font-serif"
              style={{
                left: `${note.left}%`,
                top: `${note.top}%`,
                fontSize: `${note.size}px`,
                animationDelay: `${i * 0.8}s`,
              }}
            >
              {i % 2 === 0 ? '♪' : '♫'}
            </div>
          ))}
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6 text-balance">
            Ready to Start Your Musical Journey?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto text-pretty">
            Whether you want to learn an instrument, become a tutor, or support our mission, 
            there is a place for you at The Resonance Foundation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary" className="group">
              <Link href="https://forms.gle/UNAahk69T6tvsMnv5" target="_blank" rel="noopener noreferrer">
                Become a Student
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-card text-primary hover:bg-card/90 font-semibold group">
              <Link href="/donate">
                Support Our Mission
                <Heart className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
