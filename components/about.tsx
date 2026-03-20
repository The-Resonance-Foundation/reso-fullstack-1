import { Heart, Users, Sparkles, GraduationCap } from "lucide-react"

export function About() {
  const values = [
    {
      icon: Heart,
      title: "Passion for Music",
      description: "We believe every child deserves the chance to discover the joy of music.",
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Run by passionate high school students dedicated to making a difference.",
    },
    {
      icon: Sparkles,
      title: "Inspire Creativity",
      description: "We nurture artistic expression and help students find their unique voice.",
    },
    {
      icon: GraduationCap,
      title: "Build Confidence",
      description: "Through music education, we help students grow both as musicians and individuals.",
    },
  ]

  return (
    <section id="about" className="py-20 md:py-28 bg-card relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          {/* Section Label */}
          <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-4">
            <span className="w-8 h-px bg-primary" />
            About Us
            <span className="w-8 h-px bg-primary" />
          </div>

          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
            Spreading the Joy of Music to{" "}
            <span className="text-primary">Every Young Musician</span>
          </h2>

          <p className="text-lg text-muted-foreground text-pretty">
            The Resonance Foundation is a non-profit organization dedicated to empowering young 
            musicians by providing access to music education for those who may not have it otherwise. 
            Run by passionate high school students, we connect experienced tutors with aspiring 
            musicians to inspire creativity, build confidence, and foster a lifelong love of music.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value) => (
            <div
              key={value.title}
              className="group p-6 bg-background rounded-xl border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <value.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                {value.title}
              </h3>
              <p className="text-muted-foreground">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        {/* Music Staff Decoration */}
        <div className="mt-16 flex justify-center">
          <div className="flex items-end gap-1">
            {[40, 60, 80, 100, 80, 60, 40, 55, 75, 95, 75, 55].map((height, i) => (
              <div
                key={i}
                className="w-1.5 bg-primary/20 rounded-full transition-all duration-300 hover:bg-primary/40"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
