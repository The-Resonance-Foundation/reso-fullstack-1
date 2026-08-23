"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * Nocturne animation engine (from the "Resonance Site" Claude Design project):
 * - #noc-progress   scroll progress bar
 * - #navBar         glass treatment past 50px of scroll
 * - #heroT          3D fold + fade of the hero title
 * - #noc-marquee    scroll-linked marquee strip
 * - #noc-field      pointer-reactive resonance wave field (2D canvas port of
 *                   the design's WebGL shader — same wave math, no three.js)
 * - [data-reveal]   IntersectionObserver rise-in (0.9s, cubic-bezier(0.2,0.7,0.2,1))
 * - [data-count]    easeOutExpo count-up (1500ms, prefix/suffix/comma)
 * - [data-plx]      scroll parallax on media (pre-scaled 1.14 in markup)
 * - [data-tilt]     pointer tilt (perspective 800px, rotateX -7 / rotateY 8)
 *
 * Everything respects prefers-reduced-motion (engine stays off entirely).
 */

const EASE = "cubic-bezier(0.2,0.7,0.2,1)"

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

/* 2D-canvas port of the design's resonance field: a perspective grid of dots
   whose height follows the shader's wave function, plus click ripples. */
type Ripple = { x: number; z: number; t0: number; amp: number }

function createField(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  const COLS = 110
  const ROWS = 62
  const W = 30
  const D = 17.5
  const ripples: Ripple[] = []
  let time = 0
  let w = 0
  let h = 0

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    w = window.innerWidth
    h = window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()

  // camera at (0, 3.4, 7.6) looking at origin — approximated projection
  function project(x: number, y: number, z: number, mx: number, my: number) {
    const camX = mx * 1.6
    const camY = 3.4 - my * 1.2
    const camZ = 7.6
    const dx = x - camX
    const dy = y - camY
    const dz = camZ - z
    if (dz <= 0.5) return null
    const f = (h * 1.15) / dz
    return { sx: w / 2 + dx * f, sy: h * 0.42 - dy * f, f }
  }

  return {
    resize,
    ripple(x: number, z: number, amp: number) {
      ripples.push({ x, z, t0: time, amp })
      if (ripples.length > 10) ripples.shift()
    },
    pointerRipple(clientX: number, clientY: number) {
      // map screen position roughly onto the plane
      const x = (clientX / w - 0.5) * W * 0.8
      const z = (clientY / h - 0.5) * D * 0.8
      this.ripple(x, z, 1.1)
    },
    update(dt: number, opts: { mouseX: number; mouseY: number; alpha: number; amp: number }) {
      time += dt
      const { mouseX, mouseY, alpha, amp } = opts
      ctx!.clearRect(0, 0, w, h)
      if (alpha <= 0.01) return
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const px = (c / (COLS - 1) - 0.5) * W
          const pz = (r / (ROWS - 1) - 0.5) * D
          const d0 = Math.hypot(px, pz)
          let hgt =
            (0.3 * Math.sin(d0 * 0.9 - time * 1.15) * Math.exp(-d0 * 0.05) +
              0.1 * Math.sin(px * 0.42 + time * 0.7) * Math.cos(pz * 0.36 - time * 0.5)) *
            amp
          let glow = 0
          for (const s of ripples) {
            const age = time - s.t0
            if (age > 0 && age < 7) {
              const d = Math.hypot(px - s.x, pz - s.z)
              const env = Math.exp(-Math.abs(d - age * 3.1) * 0.55) * Math.exp(-age * 0.55) * s.amp
              hgt += env * Math.sin(d * 2.6 - age * 7.5)
              glow += env
            }
          }
          const p = project(px, hgt, pz, mouseX, mouseY)
          if (!p) continue
          const vA = Math.min(1, Math.abs(hgt) * 2.2 + glow * 0.8)
          const size = Math.max(0.6, (1.1 + vA * 2.6) * (p.f / 620))
          // deep #343a69 → mid #9184d9 → hot #e6e5ed, alpha follows amplitude
          const k1 = Math.min(1, Math.max(0, (vA - 0.05) / 0.45))
          const k2 = Math.min(1, Math.max(0, (vA - 0.55) / 0.45))
          const cR = Math.round(52 + (145 - 52) * k1 + (230 - 145) * k2)
          const cG = Math.round(47 + (132 - 47) * k1 + (229 - 132) * k2)
          const cB = Math.round(105 + (217 - 105) * k1 + (237 - 217) * k2)
          ctx!.fillStyle = `rgba(${cR},${cG},${cB},${((0.13 + vA * 0.87) * alpha).toFixed(3)})`
          ctx!.fillRect(p.sx - size / 2, p.sy - size / 2, size, size)
        }
      }
    },
  }
}

export function NocturneEffects() {
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Leave content fully visible and static.
      return
    }

    const io = { current: null as IntersectionObserver | null }
    let raf = 0
    let sy = window.scrollY
    let lastY = window.scrollY
    let sVel = 0
    let mx = 0
    let my = 0
    let lastT = performance.now()
    let lastBurst = 0
    let plx: { el: HTMLElement; f: number; center: number }[] = []

    const canvas = document.getElementById("noc-field") as HTMLCanvasElement | null
    const field = canvas ? createField(canvas) : null

    const measureParallax = () => {
      plx = []
      document.querySelectorAll<HTMLElement>("[data-plx]").forEach((el) => {
        const r = el.getBoundingClientRect()
        plx.push({
          el,
          f: parseFloat(el.getAttribute("data-plx") || "0"),
          center: r.top + window.scrollY + r.height / 2,
        })
      })
    }

    const setup = () => {
      setupScrollFX(io)
      measureParallax()
    }
    setup()
    // late-mounting content (images settling, streamed segments)
    const t1 = setTimeout(setup, 400)
    const t2 = setTimeout(setup, 1500)

    const onMove = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth - 0.5
      my = e.clientY / window.innerHeight - 0.5
    }
    const onResize = () => {
      field?.resize()
      measureParallax()
    }
    const onTap = (e: PointerEvent) => {
      if (!field) return
      const target = e.target as HTMLElement
      if (target.closest("a,button,input,select,textarea,label")) return
      field.pointerRipple(e.clientX, e.clientY)
    }
    addEventListener("pointermove", onMove)
    addEventListener("resize", onResize)
    addEventListener("pointerdown", onTap)

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
      for (const p of plx) {
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
          field.ripple((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 8, 0.5 + Math.min(0.9, av * 0.006))
        }
      }
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t1)
      clearTimeout(t2)
      removeEventListener("pointermove", onMove)
      removeEventListener("resize", onResize)
      removeEventListener("pointerdown", onTap)
      io.current?.disconnect()
    }
  }, [pathname])

  return null
}
