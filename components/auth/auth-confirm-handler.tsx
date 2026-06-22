"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"

type AuthConfirmHandlerProps = {
  defaultNext?: string
}

export function AuthConfirmHandler({
  defaultNext = "/set-password",
}: AuthConfirmHandlerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function completeAuth() {
      if (!isSupabaseConfigured()) {
        setError("Supabase is not configured.")
        return
      }

      const supabase = createBrowserClient()!
      const next = searchParams.get("next") ?? defaultNext

      const hash = window.location.hash
      if (hash.length > 1) {
        const params = new URLSearchParams(hash.slice(1))
        const accessToken = params.get("access_token")
        const refreshToken = params.get("refresh_token")

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (cancelled) return

          if (sessionError) {
            setError(sessionError.message)
            return
          }

          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
          )
          router.replace(next)
          return
        }
      }

      const code = searchParams.get("code")
      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code)

        if (cancelled) return

        if (exchangeError) {
          setError(exchangeError.message)
          return
        }

        router.replace(next)
        return
      }

      setError("Invalid or expired link. Try logging in or resend your confirmation email.")
    }

    void completeAuth()

    return () => {
      cancelled = true
    }
  }, [router, searchParams, defaultNext])

  if (error) {
    return (
      <div className="max-w-md space-y-3 text-center">
        <p className="text-destructive">{error}</p>
        <Link href="/login" className="text-sm text-primary hover:underline">
          Go to login
        </Link>
      </div>
    )
  }

  return <p className="text-muted-foreground">Completing sign in…</p>
}
