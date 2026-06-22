import { cache } from "react"
import { createServerClient } from "@/lib/supabase/server"
import type { Chapter } from "@/types/database"

export const getActiveChapters = cache(async (): Promise<Chapter[]> => {
  const supabase = await createServerClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("status", "active")
    .order("name")

  if (error) {
    console.error("getActiveChapters", error.message)
    return []
  }

  return data ?? []
})
