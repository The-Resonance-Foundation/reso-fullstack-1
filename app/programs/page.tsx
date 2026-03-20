import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { Music2, Mic2, Guitar, Wind } from "lucide-react"

const programs = [
  {
    id: "woodwind",
    name: "Woodwind",
    icon: Wind,
    description: "Learn to play flute, clarinet, saxophone, oboe, bassoon, and more. Our woodwind program covers proper breathing techniques, embouchure, and musical expression.",
    instruments: ["Flute", "Clarinet", "Saxophone", "Oboe", "Bassoon"],
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09476-ER35I7HAWMvd2l6AcYelNxsRTewIFH.webp",
  },
  {
    id: "brass",
    name: "Brass",
    icon: Music2,
    description: "Master trumpet, trombone, French horn, tuba, and other brass instruments. Our brass program focuses on tone production, range development, and ensemble playing.",
    instruments: ["Trumpet", "Trombone", "French Horn", "Tuba", "Euphonium"],
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09671-rSlrlSNwyh5nW9vU0C8ZzP3lkNw9zs.webp",
  },
  {
    id: "string",
    name: "String",
    icon: Guitar,
    description: "Explore guitar, violin, viola, cello, and bass. Our string program teaches proper technique, music theory, and performance skills.",
    instruments: ["Guitar", "Violin", "Viola", "Cello", "Bass"],
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09568-3Tl1Hqb8xMIzXLbfVLGsMY2afd2Oiv.webp",
  },
  {
    id: "vocal",
    name: "Vocal",
    icon: Mic2,
    description: "Develop your singing voice with our vocal program. Learn proper breathing, pitch control, vocal health, and performance techniques.",
    instruments: ["Classical", "Contemporary", "Choral", "Solo Performance"],
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_8912-2fT7q44HWV149hpxvKPLW8mXrDaIHA.webp",
  },
]

export default function ProgramsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
              Our Music Programs
            </h1>
            <p className="text-xl text-muted-foreground">
              Comprehensive instruction across four major instrument families, designed for students of all skill levels.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Info */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
              Affordable Lessons for Everyone
            </h2>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <div className="text-3xl font-bold text-primary mb-1">$10</div>
                <div className="text-muted-foreground">Group Lessons (45 min)</div>
              </div>
              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <div className="text-3xl font-bold text-primary mb-1">$15</div>
                <div className="text-muted-foreground">Individual Lessons (45 min)</div>
              </div>
            </div>
            <p className="mt-6 text-muted-foreground">
              Financial aid is available for those who qualify. We believe cost should never be a barrier to music education.
            </p>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="space-y-20">
            {programs.map((program, index) => (
              <div 
                key={program.id} 
                className={`grid md:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <program.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-foreground">{program.name}</h2>
                  </div>
                  <p className="text-lg text-muted-foreground mb-6">{program.description}</p>
                  <div className="mb-6">
                    <h3 className="font-semibold text-foreground mb-3">Instruments Offered:</h3>
                    <div className="flex flex-wrap gap-2">
                      {program.instruments.map((instrument) => (
                        <span 
                          key={instrument} 
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {instrument}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link href="https://forms.gle/UNAahk69T6tvsMnv5" target="_blank" rel="noopener noreferrer">
                      Sign Up for {program.name} Lessons
                    </Link>
                  </Button>
                </div>
                <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                  <Image
                    src={program.image}
                    alt={`${program.name} program`}
                    width={600}
                    height={400}
                    className="rounded-2xl shadow-xl object-cover w-full h-80"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Opportunities */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
                Performance Opportunities
              </h2>
              <p className="text-lg opacity-90 mb-6">
                Beyond lessons, we offer our students real-world performance experience. Our students 
                regularly perform at community events, malls, festivals, and special occasions.
              </p>
              <p className="text-lg opacity-90 mb-6">
                These performances help students build confidence, develop stage presence, and share 
                their love of music with the community.
              </p>
              <Button asChild variant="secondary" size="lg">
                <Link href="mailto:info@theresonancefoundation.org">
                  Inquire About Performing
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_8921-nnZcC20Ec9Ja2ngaunY3LjjN4ceB4y.webp"
                alt="Resonance Foundation banner"
                width={280}
                height={200}
                className="rounded-xl object-cover h-40 w-full"
              />
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC09454-E8LBsThoFGVHAxXPOykfMzAJDO8uMe.webp"
                alt="Woodwind ensemble"
                width={280}
                height={200}
                className="rounded-xl object-cover h-40 w-full"
              />
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_8914-amMPZmjvuFjbRQtnTlTI24xNMadGnM.webp"
                alt="Clarinet section"
                width={280}
                height={200}
                className="rounded-xl object-cover h-40 w-full col-span-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of students who have discovered their love of music through The Resonance Foundation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link href="https://forms.gle/UNAahk69T6tvsMnv5" target="_blank" rel="noopener noreferrer">
                Sign Up as a Student
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/faq">View FAQ</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
