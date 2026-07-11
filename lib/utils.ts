import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function imagePath(filename: string) {
  return `/images/${filename}`
}

/** "3m ago", "2h ago", "5d ago" — compact relative timestamps for feeds. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const seconds = Math.max(0, Math.floor((now.getTime() - then) / 1000))
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: new Date(iso).getFullYear() === now.getFullYear() ? undefined : "numeric",
  })
}

/** 1284 → "1,284" · 12900 → "12.9K" · 4200000 → "4.2M" */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  }
  if (Math.abs(value) >= 10_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`
  }
  return value.toLocaleString("en-US")
}

/** 4231.5 → "$4,232" · 4200000 → "$4.2M" */
export function formatCurrencyCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  }
  if (Math.abs(value) >= 100_000) {
    return `$${(value / 1_000).toFixed(0)}K`
  }
  return `$${Math.round(value).toLocaleString("en-US")}`
}

/** "Jane Q. Doe" → "JD" for avatar fallbacks. */
export function initials(name: string | null | undefined, fallback = "M"): string {
  if (!name?.trim()) return fallback
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""
  return (first + last).toUpperCase() || fallback
}
