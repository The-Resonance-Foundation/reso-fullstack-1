import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Music2, Play } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 md:pt-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      {/* Musical Notes Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { left: 10, top: 15, size: 24 },
          { left: 85, top: 20, size: 32 },
          { left: 25, top: 70, size: 28 },
          { left: 70, top: 80, size: 36 },
          { left: 5, top: 45, size: 22 },
          { left: 92, top: 55, size: 30 },
          { left: 40, top: 10, size: 26 },
          { left: 60, top: 90, size: 34 },
          { left: 15, top: 85, size: 24 },
          { left: 75, top: 35, size: 28 },
          { left: 50, top: 50, size: 32 },
          { left: 30, top: 30, size: 26 },
        ].map((note, i) => (
          <div
            key={i}
            className="absolute text-primary/10 animate-float"
            style={{
              left: `${note.left}%`,
              top: `${note.top}%`,
              animationDelay: `${i * 0.5}s`,
              fontSize: `${note.size}px`,
            }}
          >
            {i % 2 === 0 ? '♪' : '♫'}
          </div>
        ))}
      </div>

      {/* Sound Wave Pattern */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-primary">
          <path d="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 border border-primary/20">
            <Music2 className="h-4 w-4" />
            <span className="text-sm font-medium">Empowering Young Musicians Since 2024</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance">
            The Resonance{" "}
            <span className="text-primary relative">
              Foundation
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-accent/50" viewBox="0 0 200 12" preserveAspectRatio="none">
                <path d="M0,6 Q50,0 100,6 T200,6" stroke="currentColor" strokeWidth="3" fill="none" />
              </svg>
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-primary font-medium mb-4 font-serif italic">
            Empowering Minds, Inspiring Change
          </p>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Connecting passionate young musicians with experienced tutors to inspire creativity, 
            build confidence, and foster a lifelong love of music.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6">
              <Link href="https://forms.gle/UNAahk69T6tvsMnv5" target="_blank" rel="noopener noreferrer">
                Become a Student Today
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-primary/30 hover:bg-primary/5">
              <Link href="/about">
                <Play className="mr-2 h-5 w-5" />
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  )
}
