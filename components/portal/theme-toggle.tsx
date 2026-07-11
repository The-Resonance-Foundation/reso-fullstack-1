"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative overflow-hidden"
    >
      <Sun
        aria-hidden
        className={`h-5 w-5 transition-all duration-300 ${
          isDark
            ? "translate-y-0 rotate-0 scale-100 opacity-100"
            : "translate-y-6 -rotate-90 scale-50 opacity-0"
        }`}
      />
      <Moon
        aria-hidden
        className={`absolute h-5 w-5 transition-all duration-300 ${
          isDark
            ? "-translate-y-6 rotate-90 scale-50 opacity-0"
            : "translate-y-0 rotate-0 scale-100 opacity-100"
        }`}
      />
    </Button>
  )
}
