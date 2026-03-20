"use client"

import { useEffect, useState, useRef } from "react"
import { Users, DollarSign, Heart, Award } from "lucide-react"

function AnimatedCounter({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const duration = 2000
    const steps = 60
    const increment = end / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [end, isVisible])

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

export function Impact() {
  const stats = [
    {
      icon: Users,
      value: 50,
      suffix: "+",
      label: "Tutors",
      description: "Experienced musicians ready to teach",
    },
    {
      icon: DollarSign,
      value: 0,
      suffix: "",
      prefix: "",
      label: "Thousands Raised",
      description: "For music education programs",
      customDisplay: "Thousands",
    },
    {
      icon: Heart,
      value: 1000,
      suffix: "'s",
      label: "Lives Impacted",
      description: "Young musicians inspired and empowered",
    },
    {
      icon: Award,
      value: 30,
      suffix: "+",
      label: "Dedicated Leadership Team",
      description: "Passionate student leaders",
    },
  ]

  return (
    <section id="impact" className="py-20 md:py-28 bg-primary text-primary-foreground relative overflow-hidden">
      {/* Musical Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Treble Clef Decorations */}
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 text-primary-foreground/5 text-[300px] font-serif">
        𝄞
      </div>
      <div className="absolute -right-20 top-1/2 -translate-y-1/2 text-primary-foreground/5 text-[300px] font-serif transform scale-x-[-1]">
        𝄞
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 text-primary-foreground/80 text-sm font-medium mb-4">
            <span className="w-8 h-px bg-primary-foreground/50" />
            Our Impact
            <span className="w-8 h-px bg-primary-foreground/50" />
          </div>

          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-balance">
            Making a Difference Through Music
          </h2>

          <p className="text-lg text-primary-foreground/80 text-pretty">
            Every lesson, every performance, every connection we make helps build a more musical world. 
            Here&apos;s how we&apos;re making an impact in our community.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-8 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 hover:bg-primary-foreground/15 transition-colors"
            >
              <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <stat.icon className="h-8 w-8" />
              </div>
              <div className="font-serif text-4xl md:text-5xl font-bold mb-2">
                {stat.customDisplay ? (
                  stat.customDisplay
                ) : (
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} prefix={stat.prefix || ""} />
                )}
              </div>
              <div className="text-xl font-semibold mb-1">{stat.label}</div>
              <p className="text-primary-foreground/70 text-sm">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
