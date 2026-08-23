/**
 * Verifies the corporate-volunteer permission model at the database layer.
 * Runs entirely inside a transaction that is ROLLED BACK — no data persists.
 *
 * Usage: node scripts/dev/verify-corporate-volunteers.mjs
 */
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
try {
  const raw = readFileSync(join(root, ".env.local"), "utf8")
  for (const line of raw.split("\n")) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const eq = t.indexOf("=")
    if (eq === -1) continue
    if (!process.env[t.slice(0, eq)]) process.env[t.slice(0, eq)] = t.slice(eq + 1)
  }
} catch {}

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL })
await client.connect()

let pass = 0
let fail = 0
async function check(label, sql, params, expect) {
  const { rows } = await client.query(sql, params)
  const got = rows[0]?.v
  const ok = got === expect
  if (ok) pass++
  else fail++
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  (got ${got}, want ${expect})`)
}

try {
  await client.query("BEGIN")

  const { rows: boards } = await client.query(
    `SELECT user_id FROM public.user_roles WHERE role='board_of_director' AND status='active' LIMIT 1`
  )
  const board = boards[0]?.user_id
  const { rows: parents } = await client.query(
    `SELECT user_id, chapter_id FROM public.user_roles WHERE role='student_parent' AND status='active' AND chapter_id IS NOT NULL LIMIT 1`
  )
  const subject = parents[0]?.user_id
  const { rows: chapters } = await client.query(
    `SELECT id FROM public.chapters WHERE status='active' LIMIT 1`
  )
  const chapter = chapters[0]?.id
  if (!board || !subject || !chapter) throw new Error("missing fixtures (board/parent/chapter)")

  // Board approves everything, including corporate (NULL chapter) hours
  await check("board approves corporate hours", `SELECT public.can_approve_volunteer_hours($1, NULL) AS v`, [board], true)
  await check("board approves chapter hours", `SELECT public.can_approve_volunteer_hours($1, $2) AS v`, [board, chapter], true)
  // A plain parent approves nothing
  await check("parent cannot approve chapter hours", `SELECT public.can_approve_volunteer_hours($1, $2) AS v`, [subject, chapter], false)

  // Program administrator: chapter-level yes, corporate no
  await client.query(
    `INSERT INTO public.user_roles (user_id, chapter_id, role, status) VALUES ($1, NULL, 'program_administrator', 'active')`,
    [subject]
  )
  await check("PA approves chapter hours", `SELECT public.can_approve_volunteer_hours($1, $2) AS v`, [subject, chapter], true)
  await check("PA cannot approve corporate hours", `SELECT public.can_approve_volunteer_hours($1, NULL) AS v`, [subject], false)
  await client.query(`DELETE FROM public.user_roles WHERE user_id=$1 AND role='program_administrator'`, [subject])

  // Chapter president: own chapter yes, corporate no
  await client.query(
    `INSERT INTO public.user_roles (user_id, chapter_id, role, status) VALUES ($1, $2, 'chapter_president', 'active')`,
    [subject, chapter]
  )
  await check("president approves own chapter", `SELECT public.can_approve_volunteer_hours($1, $2) AS v`, [subject, chapter], true)
  await check("president cannot approve corporate", `SELECT public.can_approve_volunteer_hours($1, NULL) AS v`, [subject], false)
  await client.query(`DELETE FROM public.user_roles WHERE user_id=$1 AND role='chapter_president'`, [subject])

  // Chapter officer: no approvals at all any more
  await client.query(
    `INSERT INTO public.user_roles (user_id, chapter_id, role, status) VALUES ($1, $2, 'chapter_officer', 'active')`,
    [subject, chapter]
  )
  await check("officer cannot approve chapter hours", `SELECT public.can_approve_volunteer_hours($1, $2) AS v`, [subject, chapter], false)
  await client.query(`DELETE FROM public.user_roles WHERE user_id=$1 AND role='chapter_officer'`, [subject])

  // Corporate hours logging eligibility
  await check("no chapterless role -> no corporate hours", `SELECT public.is_volunteer_or_tutor_in_chapter($1, NULL) AS v`, [subject], false)
  await client.query(
    `INSERT INTO public.user_roles (user_id, chapter_id, role, status) VALUES ($1, NULL, 'volunteer', 'active')`,
    [subject]
  )
  await check("org volunteer -> corporate hours ok", `SELECT public.is_volunteer_or_tutor_in_chapter($1, NULL) AS v`, [subject], true)

  // RLS: insert a corporate (NULL chapter) pending hour as the volunteer
  await client.query(`SET LOCAL role TO authenticated`)
  await client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
    JSON.stringify({ sub: subject, role: "authenticated" }),
  ])
  const ins = await client.query(
    `INSERT INTO public.volunteer_hours (user_id, chapter_id, category, hours, activity_date, status)
     VALUES ($1, NULL, 'event_support', 2, CURRENT_DATE, 'pending') RETURNING id`,
    [subject]
  )
  console.log(`PASS  RLS allows corporate hour insert (${ins.rows[0].id})`)
  pass++

  // Volunteers are all org-level after the migration
  const { rows: legacy } = await client.query(
    `SELECT count(*)::int AS v FROM public.user_roles WHERE role='volunteer' AND chapter_id IS NOT NULL`
  )
  console.log(`${legacy[0].v === 0 ? "PASS" : "FAIL"}  no chapter-scoped volunteer roles remain (${legacy[0].v})`)
  if (legacy[0].v === 0) pass++
  else fail++
} catch (err) {
  fail++
  console.error("ERROR:", err.message)
} finally {
  await client.query("ROLLBACK")
  await client.end()
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
