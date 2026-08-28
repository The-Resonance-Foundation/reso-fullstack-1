import { NextResponse } from "next/server"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getNavBadges } from "@/lib/data/nav-badges"
import { getNotificationsForUser, getUnreadNotificationCount } from "@/lib/data/phase45"

export const dynamic = "force-dynamic"

/** TEMPORARY: times each step of the authenticated request path. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const marks: Record<string, number> = {}
  const time = async <T,>(label: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now()
    try {
      return await fn()
    } finally {
      marks[label] = Math.round(performance.now() - start)
    }
  }

  const total = performance.now()

  const supabase = await time("createServerClient", async () =>
    getServerClientOrThrow()
  )
  const user = await time("auth.getUser", async () => {
    const { data } = await supabase.auth.getUser()
    return data.user
  })
  await time("auth.getUser (2nd, same client)", async () => {
    await supabase.auth.getUser()
  })
  await time("profiles select", async () => {
    await supabase.from("profiles").select("*").eq("id", user?.id ?? "").maybeSingle()
  })
  await time("user_roles select", async () => {
    await supabase
      .from("user_roles")
      .select("*, chapters(name, slug)")
      .eq("user_id", user?.id ?? "")
      .eq("status", "active")
  })
  await time("admin client trivial query", async () => {
    await createAdminClient().from("chapters").select("id").limit(1)
  })
  await time("getNavBadges", () => getNavBadges())
  await time("getNotificationsForUser", () => getNotificationsForUser())
  await time("getUnreadNotificationCount", () => getUnreadNotificationCount())

  return NextResponse.json({
    region: process.env.VERCEL_REGION ?? "local",
    totalMs: Math.round(performance.now() - total),
    marks,
  })
}
