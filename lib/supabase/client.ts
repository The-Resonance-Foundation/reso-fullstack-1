import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

const SUPABASE_NOT_CONFIGURED =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function createBrowserClient() {
  if (!isSupabaseConfigured()) {
    return null
  }

  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function getSupabaseOrThrow() {
  const client = createBrowserClient()
  if (!client) {
    throw new Error(SUPABASE_NOT_CONFIGURED)
  }
  return client
}
