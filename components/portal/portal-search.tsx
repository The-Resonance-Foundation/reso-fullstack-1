"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CornerDownLeft, Search } from "lucide-react"
import { buildPortalNav, type PortalNavFlags } from "@/components/portal/portal-nav"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type PaletteItem = {
  label: string
  group: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

/**
 * Quick-jump command palette (⌘K / Ctrl+K): fuzzy-filters every page the
 * current member can reach and navigates on Enter.
 */
export function PortalSearch({ flags }: { flags: PortalNavFlags }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const items = useMemo<PaletteItem[]>(
    () =>
      buildPortalNav(flags).flatMap((group) =>
        group.items.map((item) => ({
          label: item.label,
          group: group.label,
          href: item.href,
          icon: item.icon,
        }))
      ),
    [flags]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)
    )
  }, [items, query])

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setQuery("")
      setCursor(0)
    }
    setOpen(next)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((prev) => {
          if (!prev) {
            setQuery("")
            setCursor(0)
          }
          return !prev
        })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function go(item: PaletteItem | undefined) {
    if (!item) return
    setOpen(false)
    router.push(item.href)
  }

  function onInputKey(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setCursor((c) => Math.min(c + 1, filtered.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (event.key === "Enter") {
      event.preventDefault()
      go(filtered[cursor])
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        aria-label="Search the portal"
        className="hidden h-9 w-full max-w-[380px] items-center gap-2.5 rounded-xl bg-[rgba(255,242,226,0.05)] px-3.5 text-left text-[13px] text-muted-foreground transition-colors hover:bg-[rgba(255,242,226,0.09)] md:flex"
      >
        <Search className="h-4 w-4 flex-none opacity-70" aria-hidden />
        <span className="min-w-0 flex-1 truncate">Jump to a page…</span>
        <kbd className="flex-none rounded-md border border-border bg-[rgba(0,0,0,0.2)] px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide text-foreground/60">
          ⌘K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        aria-label="Search the portal"
        className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-[rgba(255,242,226,0.07)] hover:text-foreground md:hidden"
      >
        <Search className="h-4 w-4" aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="top-[18%] max-w-lg translate-y-0 gap-0 p-0">
          <DialogTitle className="sr-only">Jump to a page</DialogTitle>
          <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
            <Search className="h-4 w-4 flex-none text-muted-foreground" aria-hidden />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setCursor(0)
              }}
              onKeyDown={onInputKey}
              placeholder="Where do you want to go?"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          <div className="max-h-[320px] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Nothing matches &ldquo;{query}&rdquo;
              </p>
            ) : (
              filtered.map((item, i) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.href + item.label}
                    type="button"
                    onClick={() => go(item)}
                    onMouseEnter={() => setCursor(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] transition-colors",
                      i === cursor
                        ? "bg-[rgba(255,242,226,0.09)] text-foreground"
                        : "text-foreground/80"
                    )}
                  >
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--acc)_13%,transparent)] text-[var(--acc-hi,#F8B269)]">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                    <span className="flex-none text-[11px] uppercase tracking-wider text-muted-foreground/70">
                      {item.group}
                    </span>
                    {i === cursor ? (
                      <CornerDownLeft
                        className="h-3.5 w-3.5 flex-none text-muted-foreground"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
