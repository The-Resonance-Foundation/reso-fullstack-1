"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { routes } from "@/lib/routes"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Portal error:", error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center gap-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden />
      </span>
      <div className="space-y-1.5">
        <h2 className="font-serif text-xl font-bold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          We hit an unexpected error loading this page. Your data is safe —
          try again, or head back to your dashboard.
        </p>
        {error.digest ? (
          <p className="text-xs text-muted-foreground/60">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" aria-hidden />
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href={routes.portal.dashboard}>Go to dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
