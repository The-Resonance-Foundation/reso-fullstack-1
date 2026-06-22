"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"

/** Picks up invite tokens left on /login when the server callback could not read the hash. */
export function LoginHashRecovery() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash || hash.length <= 1) return

    const params = new URLSearchParams(hash.slice(1))
    if (!params.get("access_token") || !params.get("refresh_token")) return

    async function recover() {
      if (!isSupabaseConfigured()) return

      const supabase = createBrowserClient()!
      const accessToken = params.get("access_token")!
      const refreshToken = params.get("refresh_token")!

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) return

      window.history.replaceState(null, "", "/login")
      router.replace("/set-password")
    }

    void recover()
  }, [router])

  return null
}
