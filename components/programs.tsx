import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Music, Mic2, Guitar, Wind, Drum } from "lucide-react"

export function Programs() {
  const instruments = [
    {
      icon: Wind,
      name: "Woodwind",
      description: "Flute, clarinet, saxophone, oboe, and more. Master breath control and fingering techniques.",
      color: "from-blue-500/20 to-blue-600/20",
      borderColor: "border-blue-500/30",
    },
    {
      icon: Music,
      name: "Brass",
      description: "Trumpet, trombone, French horn, tuba. Develop embouchure and musical expression.",
      color: "from-amber-500/20 to-amber-600/20",
      borderColor: "border-amber-500/30",
    },
    {
      icon: Guitar,
      name: "String",
      description: "Violin, viola, cello, bass, and guitar. Learn proper technique and musicality.",
      color: "from-rose-500/20 to-rose-600/20",
      borderColor: "border-rose-500/30",
    },
    {
      icon: Mic2,
      name: "Vocal",
      description: "Develop your voice with proper technique, breath support, and performance skills.",
      color: "from-purple-500/20 to-purple-600/20",
      borderColor: "border-purple-500/30",
    },
    {
      icon: Drum,
      name: "Percussion",
      description: "Drums, timpani, mallet instruments, and more. Master rhythm and coordination.",
      color: "from-emerald-500/20 to-emerald-600/20",
      borderColor: "border-emerald-500/30",
    },
  ]

  return (
    <section id="programs" className="py-20 md:py-28 bg-gradient-to-b from-background to-secondary/30 relative">
      {/* Sound Wave Background */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="none">
          <path
            d="M0,200 Q100,100 200,200 T400,200 T600,200 T800,200 T1000,200 T1200,200"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-primary"
          />
          <path
            d="M0,200 Q100,300 200,200 T400,200 T600,200 T800,200 T1000,200 T1200,200"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-primary"
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-4">
            <span className="w-8 h-px bg-primary" />
            Our Programs
            <span className="w-8 h-px bg-primary" />
          </div>

          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
            Discover Your Musical{" "}
            <span className="text-primary">Passion</span>
          </h2>

          <p className="text-lg text-muted-foreground text-pretty">
            We offer comprehensive tutoring across a wide range of instruments. 
            Our experienced tutors help students of all levels develop their skills and love for music.
          </p>
        </div>

        {/* Instruments Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {instruments.map((instrument) => (
            <div
              key={instrument.name}
              className={`group relative p-8 rounded-2xl bg-gradient-to-br ${instrument.color} border ${instrument.borderColor} hover:scale-[1.02] transition-all duration-300`}
            >
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <instrument.icon className="h-20 w-20 text-foreground" />
              </div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-card rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <instrument.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
                  {instrument.name}
                </h3>
                <p className="text-muted-foreground">
                  {instrument.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Performance CTA */}
        <div className="bg-card rounded-2xl p-8 md:p-12 border border-border text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Music className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">
              Interested in Performing with Us?
            </h3>
            <p className="text-muted-foreground mb-6">
              We regularly host community performances where our students showcase their talents. 
              If you&apos;re interested in performing with The Resonance Foundation, we&apos;d love to hear from you!
            </p>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="mailto:info@theresonancefoundation.org">
                Email Us to Perform
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
