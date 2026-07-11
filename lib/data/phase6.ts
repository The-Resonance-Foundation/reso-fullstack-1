import "server-only"

import { cache } from "react"
import { verifySession } from "@/lib/auth/dal"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import type { AuditLog, Donation, DonationTotals } from "@/types/database"
import type { AuditAction, DonationStatus } from "@/types/enums"

type DonationFilters = {
  status?: DonationStatus
  from?: string
  to?: string
  limit?: number
}

type AuditLogFilters = {
  action?: AuditAction
  from?: string
  to?: string
  limit?: number
}

async function attachRecorderNames<T extends { recorded_by: string | null }>(
  rows: T[]
): Promise<(T & { recorder_name?: string | null })[]> {
  if (!rows.length) return rows
  const ids = [...new Set(rows.map((r) => r.recorded_by).filter(Boolean) as string[])]
  if (!ids.length) return rows.map((r) => ({ ...r, recorder_name: null }))

  const admin = createAdminClient()
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", ids)
  const byId = new Map((profiles ?? []).map((p) => [p.id, p.full_name]))

  return rows.map((row) => ({
    ...row,
    recorder_name: row.recorded_by ? byId.get(row.recorded_by) ?? "Staff" : null,
  }))
}

async function attachActorNames<T extends { actor_user_id: string | null }>(
  rows: T[]
): Promise<(T & { actor_name?: string | null })[]> {
  if (!rows.length) return rows
  const ids = [...new Set(rows.map((r) => r.actor_user_id).filter(Boolean) as string[])]
  if (!ids.length) return rows.map((r) => ({ ...r, actor_name: null }))

  const admin = createAdminClient()
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", ids)
  const byId = new Map((profiles ?? []).map((p) => [p.id, p.full_name]))

  return rows.map((row) => ({
    ...row,
    actor_name: row.actor_user_id ? byId.get(row.actor_user_id) ?? "Staff" : "System",
  }))
}

export const getDonationsForAdmin = cache(
  async (filters: DonationFilters = {}): Promise<Donation[]> => {
    await verifySession()
    const supabase = await getServerClientOrThrow()
    const limit = filters.limit ?? 50

    let query = supabase
      .from("donations")
      .select("*")
      .order("donated_at", { ascending: false })
      .limit(limit)

    if (filters.status) query = query.eq("status", filters.status)
    if (filters.from) query = query.gte("donated_at", filters.from)
    if (filters.to) query = query.lte("donated_at", filters.to)

    const { data, error } = await query
    if (error) {
      console.error("getDonationsForAdmin", error.message)
      return []
    }

    return attachRecorderNames((data ?? []) as Donation[])
  }
)

export const getDonationTotalsForAdmin = cache(async (): Promise<DonationTotals> => {
  await verifySession()
  const supabase = await getServerClientOrThrow()

  // Aggregate in SQL (get_donation_totals RPC) instead of fetching every
  // completed donation row and summing in JS.
  const { data, error } = await supabase.rpc("get_donation_totals")

  if (error) {
    console.error("getDonationTotalsForAdmin", error.message)
    return { totalAmount: 0, completedCount: 0, last30DaysAmount: 0 }
  }

  const row = Array.isArray(data) ? data[0] : data

  if (!row) {
    return { totalAmount: 0, completedCount: 0, last30DaysAmount: 0 }
  }

  return {
    totalAmount: Number(row.total_amount ?? 0),
    completedCount: Number(row.completed_count ?? 0),
    last30DaysAmount: Number(row.last_30_days_amount ?? 0),
  }
})

export const getAuditLogsForAdmin = cache(
  async (filters: AuditLogFilters = {}): Promise<AuditLog[]> => {
    await verifySession()
    const supabase = await getServerClientOrThrow()
    const limit = filters.limit ?? 50

    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (filters.action) query = query.eq("action", filters.action)
    if (filters.from) query = query.gte("created_at", filters.from)
    if (filters.to) query = query.lte("created_at", filters.to)

    const { data, error } = await query
    if (error) {
      console.error("getAuditLogsForAdmin", error.message)
      return []
    }

    return attachActorNames((data ?? []) as AuditLog[])
  }
)
