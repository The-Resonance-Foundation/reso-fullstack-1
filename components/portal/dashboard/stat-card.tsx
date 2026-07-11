"use client"

import { useEffect, useRef, useState } from "react"
import { animate, motion, useReducedMotion } from "motion/react"
import { Card } from "@/components/ui/card"
import { cn, formatCompact, formatCurrencyCompact } from "@/lib/utils"

/** Serializable formatter variants (functions can't cross the RSC boundary). */
export type StatFormat = "number" | "currency" | "minutes"

const FORMATTERS: Record<StatFormat, (n: number) => string> = {
  number: formatCompact,
  currency: formatCurrencyCompact,
  minutes: (n) => `${formatCompact(n)} min`,
}

type StatCardProps = {
  label: string
  /** Raw numeric value — formatted client-side and counted up on mount. */
  value: number
  format?: StatFormat
  delta?: {
    text: string
    direction: "up" | "down" | "flat"
    /** Whether "up" is good news (colors the delta). */
    upIsGood?: boolean
  }
  /** Pre-rendered icon node (rendered on the server, serialized as JSX). */
  icon: React.ReactNode
  hint?: string
  /** 0-based position for staggered entrance. */
  index?: number
}

function AnimatedValue({ value, format }: { value: number; format: StatFormat }) {
  const reduceMotion = useReducedMotion()
  const fmt = FORMATTERS[format]
  const [display, setDisplay] = useState(reduceMotion ? fmt(value) : fmt(0))
  const ran = useRef(false)

  useEffect(() => {
    const fmtNow = FORMATTERS[format]
    if (reduceMotion || ran.current) {
      setDisplay(fmtNow(value))
      return
    }
    ran.current = true
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(fmtNow(Math.round(latest))),
      onComplete: () => setDisplay(fmtNow(value)),
    })
    return () => controls.stop()
  }, [value, format, reduceMotion])

  return (
    <span className="font-sans text-3xl font-semibold leading-none tracking-tight">
      {display}
    </span>
  )
}

export function StatCard({
  label,
  value,
  format = "number",
  delta,
  icon,
  hint,
  index = 0,
}: StatCardProps) {
  const deltaColor =
    !delta || delta.direction === "flat"
      ? "text-muted-foreground"
      : (delta.direction === "up") === (delta.upIsGood ?? true)
        ? "text-success"
        : "text-destructive"

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.21, 1.02, 0.73, 1] }}
      whileHover={{ y: -2 }}
    >
      <Card className="h-full p-5 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <AnimatedValue value={value} format={format} />
            {delta ? (
              <p className={cn("text-xs font-medium", deltaColor)}>
                {delta.direction === "up" ? "↑ " : delta.direction === "down" ? "↓ " : ""}
                {delta.text}
              </p>
            ) : hint ? (
              <p className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:h-5 [&_svg]:w-5">
            {icon}
          </span>
        </div>
      </Card>
    </motion.div>
  )
}
