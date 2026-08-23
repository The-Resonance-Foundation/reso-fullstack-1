import { NextResponse } from "next/server"
import {
  canApproveVolunteerHours,
  canManageLessons,
  canReviewApplicants,
  canViewDonations,
  verifySession,
} from "@/lib/auth/dal"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerClientOrThrow } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/** Excel formula-injection guard + standard CSV quoting. */
function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value)
  if (/^[=+\-@\t]/.test(text)) text = `'${text}`
  if (/[",\n\r]/.test(text)) text = `"${text.replaceAll('"', '""')}"`
  return text
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(",")]
  for (const row of rows) lines.push(row.map(csvCell).join(","))
  return lines.join("\r\n") + "\r\n"
}

async function namesByUserId(ids: string[]) {
  if (!ids.length) return new Map<string, { name: string | null; email: string | null }>()
  const admin = createAdminClient()
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", [...new Set(ids)])
  return new Map((data ?? []).map((p) => [p.id, { name: p.full_name, email: p.email }]))
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dataset: string }> }
) {
  const { dataset } = await params
  await verifySession()
  const supabase = await getServerClientOrThrow()

  let filename = ""
  let csv = ""

  if (dataset === "donations") {
    if (!(await canViewDonations())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { data } = await supabase
      .from("donations")
      .select("*, chapters(name)")
      .order("donated_at", { ascending: false })
    filename = "donations"
    csv = toCsv(
      ["Date", "Amount", "Currency", "Net", "Fees", "Status", "Source", "Donor name", "Donor email", "Chapter", "Notes"],
      (data ?? []).map((d) => [
        d.donated_at?.slice(0, 10),
        d.amount,
        d.currency,
        d.net_amount,
        d.fee_amount,
        d.status,
        d.source,
        d.payer_name,
        d.payer_email,
        d.chapters?.name ?? "Org-wide",
        d.notes,
      ])
    )
  } else if (dataset === "volunteer-hours") {
    if (!(await canApproveVolunteerHours())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { data } = await supabase
      .from("volunteer_hours")
      .select("*, chapters(name)")
      .order("activity_date", { ascending: false })
    const people = await namesByUserId((data ?? []).map((r) => r.user_id))
    filename = "volunteer-hours"
    csv = toCsv(
      ["Volunteer", "Email", "Chapter", "Activity date", "Category", "Hours", "Status", "Description"],
      (data ?? []).map((r) => [
        people.get(r.user_id)?.name ?? "",
        people.get(r.user_id)?.email ?? "",
        r.chapters?.name ?? "",
        r.activity_date,
        r.category,
        r.hours,
        r.status,
        r.description,
      ])
    )
  } else if (dataset === "families") {
    if (!(await canReviewApplicants())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { data } = await supabase
      .from("students")
      .select("*, chapters(name)")
      .order("created_at", { ascending: false })
    const parents = await namesByUserId((data ?? []).map((s) => s.parent_user_id))
    filename = "families"
    csv = toCsv(
      ["Student", "Status", "Instrument", "Skill level", "Financial aid", "Chapter", "Parent", "Parent email", "Enrolled"],
      (data ?? []).map((s) => [
        `${s.first_name} ${s.last_name}`,
        s.status,
        s.instrument,
        s.skill_level,
        s.financial_aid ? "yes" : "no",
        s.chapters?.name ?? "",
        parents.get(s.parent_user_id)?.name ?? "",
        parents.get(s.parent_user_id)?.email ?? "",
        s.created_at?.slice(0, 10),
      ])
    )
  } else if (dataset === "lessons") {
    if (!(await canManageLessons())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { data } = await supabase
      .from("lessons")
      .select("*, chapters(name), students(first_name, last_name)")
      .order("scheduled_start", { ascending: false })
    const tutors = await namesByUserId(
      (data ?? []).map((l) => l.tutor_user_id).filter(Boolean) as string[]
    )
    filename = "lessons"
    csv = toCsv(
      ["Start", "End", "Status", "Student", "Tutor", "Chapter", "Location"],
      (data ?? []).map((l) => [
        l.scheduled_start,
        l.scheduled_end,
        l.status,
        l.students ? `${l.students.first_name} ${l.students.last_name}` : "",
        l.tutor_user_id ? (tutors.get(l.tutor_user_id)?.name ?? "") : "",
        l.chapters?.name ?? "",
        l.location,
      ])
    )
  } else {
    return NextResponse.json({ error: "Unknown export" }, { status: 404 })
  }

  const stamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="resonance-${filename}-${stamp}.csv"`,
    },
  })
}
