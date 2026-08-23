"use client"

/**
 * Playful success burst: a small confetti of warm-palette particles from the
 * center of the viewport (or a given origin). Fire-and-forget; respects
 * prefers-reduced-motion.
 */
const COLORS = ["#F8B269", "#F08C2E", "#8FE3A8", "#FBF6EE", "#C57326", "#A9EDC0"]

export function celebrate(origin?: { x: number; y: number }) {
  if (typeof window === "undefined") return
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

  const x = origin?.x ?? window.innerWidth / 2
  const y = origin?.y ?? window.innerHeight / 2.5
  const count = 18

  for (let i = 0; i < count; i++) {
    const el = document.createElement("span")
    el.className = "celebrate-particle"
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6
    const dist = 60 + Math.random() * 90
    const size = 5 + Math.random() * 6
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    el.style.width = `${size}px`
    el.style.height = `${size * (Math.random() > 0.5 ? 1 : 0.45)}px`
    el.style.background = COLORS[i % COLORS.length]
    el.style.setProperty("--cx", `${Math.cos(angle) * dist}px`)
    el.style.setProperty("--cy", `${Math.sin(angle) * dist - 40}px`)
    el.style.setProperty("--cr", `${Math.round(Math.random() * 360 - 180)}deg`)
    el.style.animationDelay = `${Math.random() * 90}ms`
    document.body.appendChild(el)
    window.setTimeout(() => el.remove(), 1100)
  }
}

/** Convenience: celebrate from the position of a click/submit event target. */
export function celebrateFrom(target: HTMLElement | null) {
  if (!target) return celebrate()
  const r = target.getBoundingClientRect()
  celebrate({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
}
