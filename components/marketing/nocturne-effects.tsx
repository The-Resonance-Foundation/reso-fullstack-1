"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import type { ResonanceField } from "@/lib/marketing/resonance-field"
import { ResonanceAudio } from "@/lib/marketing/resonance-audio"

/**
 * Nocturne animation + sound engine (from the "Resonance Site" Claude Design
 * project):
 * - #noc-field      WebGL resonance wave field (three.js, additive-blended
 *                   point grid) — tapping the hero drops a ripple that plays a
 *                   note; fast scrolling stirs the water
 * - #noc-progress   scroll progress bar
 * - #navBar         glass treatment past 50px of scroll
 * - #heroT          3D fold + fade of the hero title
 * - #noc-marquee    scroll-linked marquee strip
 * - [data-reveal]   IntersectionObserver rise-in (0.9s, cubic-bezier(0.2,0.7,0.2,1))
 * - [data-count]    easeOutExpo count-up (1500ms, prefix/suffix/comma)
 * - [data-plx]      scroll parallax on media (pre-scaled 1.14 in markup)
 * - [data-tilt]     pointer tilt (perspective 800px, rotateX -7 / rotateY 8)
 * - Audio: ambient pad + ripple plinks + nav hover notes + button clicks,
 *   toggled by the header's sound button ("noc-sound" event, localStorage)
 *
 * The field, audio, and render loop mount once and survive client-side
 * navigation; only the per-page element scan re-runs on route changes.
 * Everything respects prefers-reduced-motion (engine stays off entirely).
 */

const EASE = "cubic-bezier(0.2,0.7,0.2,1)"

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function setupScrollFX(io: { current: IntersectionObserver | null }) {
  const vh = window.innerHeight

  document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-rv])").forEach((el) => {
    el.setAttribute("data-rv", "1")
    const r = el.getBoundingClientRect()
    if (r.top > vh * 0.86) {
      el.style.opacity = "0"
      el.style.transform = "translateY(30px)"
      io.current ||= new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) return
            const t = en.target as HTMLElement
            const d = parseInt(t.getAttribute("data-reveal-delay") || "0", 10)
            setTimeout(() => {
              t.style.transition = `opacity 0.9s ${EASE}, transform 0.9s ${EASE}`
              t.style.opacity = "1"
              t.style.transform = "translateY(0)"
            }, d)
            io.current?.unobserve(t)
          })
        },
        { threshold: 0.12 }
      )
      io.current.observe(el)
    }
  })

  document.querySelectorAll<HTMLElement>("[data-count]:not([data-cv])").forEach((el) => {
    el.setAttribute("data-cv", "1")
    const ioC = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return
          runCount(en.target as HTMLElement)
          ioC.unobserve(en.target)
        })
      },
      { threshold: 0.4 }
    )
    ioC.observe(el)
  })

  document.querySelectorAll<HTMLElement>("[data-tilt]:not([data-tv])").forEach((el) => {
    el.setAttribute("data-tv", "1")
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect()
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -7
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 8
      el.style.transition = "transform 0.09s linear"
      el.style.transform = `perspective(800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(1.025)`
      el.style.zIndex = "3"
    })
    el.addEventListener("pointerleave", () => {
      el.style.transition = `transform 0.6s ${EASE}`
      el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)"
      el.style.zIndex = ""
    })
  })
}

function runCount(el: HTMLElement) {
  const target = parseInt(el.getAttribute("data-count") || "0", 10)
  const pre = el.getAttribute("data-prefix") || ""
  const suf = el.getAttribute("data-suffix") || ""
  const comma = el.getAttribute("data-comma") === "1"
  const t0 = performance.now()
  const dur = 1500
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / dur)
    const e = 1 - Math.pow(2, -10 * k)
    const v = Math.round(target * (k >= 1 ? 1 : e))
    el.textContent = pre + (comma ? v.toLocaleString("en-US") : String(v)) + suf
    if (k < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

type Plx = { el: HTMLElement; f: number; center: number }

function measureParallax(plxRef: { current: Plx[] }) {
  const plx: Plx[] = []
  document.querySelectorAll<HTMLElement>("[data-plx]").forEach((el) => {
    const r = el.getBoundingClientRect()
    plx.push({
      el,
      f: parseFloat(el.getAttribute("data-plx") || "0"),
      center: r.top + window.scrollY + r.height / 2,
    })
  })
  plxRef.current = plx
}

// Pentatonic-ish scales from the design — hero taps map screen position to a
// note; nav hovers walk the second scale.
const TAP_SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25]
const HOVER_SCALE = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33]

export function NocturneEffects() {
  const pathname = usePathname()
  const ioRef = useRef<IntersectionObserver | null>(null)
  const plxRef = useRef<Plx[]>([])

  // Engine: field, audio, listeners, render loop — mounts once.
  useEffect(() => {
    if (prefersReducedMotion()) return

    let raf = 0
    let disposed = false
    let sy = window.scrollY
    let lastY = window.scrollY
    let sVel = 0
    let mx = 0
    let my = 0
    let lastT = performance.now()
    let lastBurst = 0
    let field: ResonanceField | null = null
    const audio = new ResonanceAudio()

    const host = document.getElementById("noc-field")
    if (host && !host.hasChildNodes()) {
      import("@/lib/marketing/resonance-field")
        .then((m) => {
          if (disposed) return
          field = m.createField(host)
        })
        .catch((err) => console.warn("resonance field unavailable", err))
    }

    const onMove = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth - 0.5
      my = e.clientY / window.innerHeight - 0.5
    }
    const onResize = () => {
      field?.resize()
      measureParallax(plxRef)
    }
    // First gesture unlocks the AudioContext (autoplay policy); a tap on the
    // hero also drops a ripple whose position picks the note.
    const onPointerDown = (e: PointerEvent) => {
      audio.init()
      const target = e.target as HTMLElement
      if (!target.closest("#noc-hero")) return
      if (target.closest("a,button,input,select,textarea,label")) return
      if (!field) return
      const pos = field.pointerRipple(e.clientX, e.clientY)
      if (pos !== null) {
        const idx = Math.max(
          0,
          Math.min(TAP_SCALE.length - 1, Math.floor(pos * TAP_SCALE.length))
        )
        audio.plink(TAP_SCALE[idx])
      }
    }
    // Nav hover notes — each primary nav link hums its own pitch.
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest<HTMLElement>("#navBar nav a")
      if (!link) return
      const related = e.relatedTarget as HTMLElement | null
      if (related && related.closest("#navBar nav a") === link) return
      const links = Array.from(document.querySelectorAll("#navBar nav a"))
      const idx = links.indexOf(link)
      if (idx >= 0) audio.plink(HOVER_SCALE[idx % HOVER_SCALE.length], 0.22, 1.1)
    }
    // Button clicks get the low click; nav links too (page-change click).
    const onClickDelegate = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('a[class*="btn-"],button[class*="btn-"],#navBar a')) {
        audio.click()
      }
    }
    const onSoundToggle = (e: Event) => {
      const detail = (e as CustomEvent<{ muted: boolean }>).detail
      audio.setMuted(detail.muted)
    }
    addEventListener("pointermove", onMove)
    addEventListener("resize", onResize)
    addEventListener("pointerdown", onPointerDown)
    document.addEventListener("mouseover", onMouseOver)
    document.addEventListener("click", onClickDelegate, true)
    window.addEventListener("noc-sound", onSoundToggle)

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, (t - lastT) / 1000)
      lastT = t
      const y = window.scrollY
      const vel = y - lastY
      lastY = y
      sVel += (vel - sVel) * 0.08
      sy += (y - sy) * 0.1
      const av = Math.abs(sVel)

      const prog = document.getElementById("noc-progress")
      if (prog) {
        const max = document.documentElement.scrollHeight - window.innerHeight
        prog.style.width = (max > 0 ? (y / max) * 100 : 0) + "%"
      }
      const nav = document.getElementById("navBar")
      if (nav) {
        const on = y > 50
        nav.style.background = on
          ? "color-mix(in srgb, var(--background) 86%, transparent)"
          : "transparent"
        nav.style.backdropFilter = on ? "blur(14px)" : "none"
        nav.style.borderColor = on ? "var(--border)" : "transparent"
      }
      const mq = document.getElementById("noc-marquee")
      if (mq) mq.style.transform = `translateX(${-((sy * 0.38) % 1600).toFixed(1)}px)`
      const ht = document.getElementById("heroT")
      if (ht) {
        const k = Math.min(1, sy / 700)
        ht.style.transform = `rotateX(${(k * 24).toFixed(2)}deg) translateY(${(sy * 0.32).toFixed(1)}px) scale(${(1 - k * 0.08).toFixed(3)})`
        ht.style.opacity = String(Math.max(0, 1 - k * 1.15))
      }
      for (const p of plxRef.current) {
        const off = (p.center - sy - window.innerHeight / 2) * -p.f
        p.el.style.transform = `translateY(${off.toFixed(1)}px) scale(1.14)`
      }
      if (field) {
        const onHome = document.getElementById("heroT") !== null
        const heroK = Math.min(1, sy / (window.innerHeight * 0.9))
        const alpha = onHome ? 1 - heroK * 0.68 : 0.3
        field.update(dt * (1 + av * 0.045), {
          mouseX: mx,
          mouseY: my,
          alpha,
          amp: 1 + Math.min(1.4, av * 0.02),
        })
        if (av > 55 && t - lastBurst > 320) {
          lastBurst = t
          field.ripple(
            (Math.random() - 0.5) * 16,
            (Math.random() - 0.5) * 8,
            0.5 + Math.min(0.9, av * 0.006)
          )
        }
      }
    }
    raf = requestAnimationFrame(loop)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      removeEventListener("pointermove", onMove)
      removeEventListener("resize", onResize)
      removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("mouseover", onMouseOver)
      document.removeEventListener("click", onClickDelegate, true)
      window.removeEventListener("noc-sound", onSoundToggle)
      field?.dispose()
      field = null
    }
  }, [])

  // Per-page element scan — re-runs on client-side navigation.
  useEffect(() => {
    if (prefersReducedMotion()) return
    const setup = () => {
      setupScrollFX(ioRef)
      measureParallax(plxRef)
    }
    setup()
    // late-mounting content (images settling, streamed segments)
    const t1 = setTimeout(setup, 400)
    const t2 = setTimeout(setup, 1500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [pathname])

  useEffect(() => {
    return () => {
      ioRef.current?.disconnect()
      ioRef.current = null
    }
  }, [])

  return null
}
