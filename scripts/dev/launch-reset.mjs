/**
 * Pre-launch production reset.
 *
 * 1. Backs up every public table + the auth user list to backups/.
 * 2. Deletes every auth account except KEEP_EMAIL (cascades user-owned rows).
 * 3. Deletes all remaining content rows (chapters, applicants, events, ...).
 * 4. Empties the certificates and resources storage buckets.
 * 5. Prints a post-wipe verification of every table.
 *
 * Usage: node scripts/dev/launch-reset.mjs --confirm
 */
import { createClient } from "@supabase/supabase-js"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import pg from "pg"

const KEEP_EMAIL = "pathakansh10@gmail.com"

if (!process.argv.includes("--confirm")) {
  console.error("Refusing to run without --confirm (this wipes production data).")
  process.exit(1)
}

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const env = {}
for (const line of readFileSync(`${ROOT}/.env.local`, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const db = new pg.Client({ connectionString: env.SUPABASE_DB_URL })
await db.connect()

// Children before parents so plain DELETEs never hit FK restrictions.
const WIPE_TABLES = [
  "messages",
  "conversation_members",
  "conversations",
  "event_attendance",
  "event_rsvps",
  "events",
  "lesson_logs",
  "practice_logs",
  "lesson_requests",
  "lessons",
  "student_tutor_assignments",
  "assignments",
  "tutor_availability",
  "guardian_consents",
  "students",
  "certificates",
  "volunteer_hours",
  "applicants",
  "announcements",
  "resources",
  "notifications",
  "audit_logs",
  "donations",
  "paypal_webhook_events",
  "chapters",
]

// ---------------------------------------------------------------------------
// 1. Backup
// ---------------------------------------------------------------------------
const backup = { takenAt: new Date().toISOString(), tables: {}, authUsers: [] }
const { rows: tables } = await db.query(
  `SELECT table_name FROM information_schema.tables
   WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> 'schema_migrations'`
)
for (const { table_name } of tables) {
  const { rows } = await db.query(`SELECT * FROM public."${table_name}"`)
  backup.tables[table_name] = rows
}
const { data: userList } = await admin.auth.admin.listUsers({ perPage: 500 })
backup.authUsers = userList.users.map((u) => ({
  id: u.id,
  email: u.email,
  created_at: u.created_at,
  user_metadata: u.user_metadata,
}))
mkdirSync(`${ROOT}/backups`, { recursive: true })
const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-")
const backupPath = `${ROOT}/backups/pre-launch-wipe-${stamp}.json`
writeFileSync(backupPath, JSON.stringify(backup, null, 2))
console.log(`Backup written: ${backupPath}`)

// ---------------------------------------------------------------------------
// 2. Delete accounts (cascade removes their rows)
// ---------------------------------------------------------------------------
const keep = userList.users.find((u) => u.email === KEEP_EMAIL)
if (!keep) throw new Error(`Keep account ${KEEP_EMAIL} not found — aborting.`)
for (const u of userList.users) {
  if (u.id === keep.id) continue
  const { error } = await admin.auth.admin.deleteUser(u.id)
  console.log(error ? `FAILED delete ${u.email}: ${error.message}` : `deleted account ${u.email}`)
}

// ---------------------------------------------------------------------------
// 3. Wipe content tables
// ---------------------------------------------------------------------------
for (const t of WIPE_TABLES) {
  const res = await db.query(`DELETE FROM public."${t}"`)
  console.log(`wiped ${t}: ${res.rowCount} rows`)
}
// Anything user-scoped that survived (kept account's own rows are content too)
const { rowCount: strayProfiles } = await db.query(
  `DELETE FROM public.profiles WHERE id <> $1`,
  [keep.id]
)
const { rowCount: strayRoles } = await db.query(
  `DELETE FROM public.user_roles WHERE user_id <> $1`,
  [keep.id]
)
console.log(`stray profiles removed: ${strayProfiles}, stray roles removed: ${strayRoles}`)

// ---------------------------------------------------------------------------
// 4. Empty storage buckets
// ---------------------------------------------------------------------------
async function emptyBucket(bucket) {
  let removed = 0
  async function walk(prefix) {
    const { data: entries, error } = await admin.storage
      .from(bucket)
      .list(prefix, { limit: 1000 })
    if (error) throw error
    const files = []
    for (const e of entries ?? []) {
      const path = prefix ? `${prefix}/${e.name}` : e.name
      if (e.id === null) await walk(path) // folder
      else files.push(path)
    }
    if (files.length) {
      const { error: rmErr } = await admin.storage.from(bucket).remove(files)
      if (rmErr) throw rmErr
      removed += files.length
    }
  }
  await walk("")
  console.log(`emptied bucket ${bucket}: ${removed} files`)
}
await emptyBucket("certificates")
await emptyBucket("resources")

// ---------------------------------------------------------------------------
// 5. Verify
// ---------------------------------------------------------------------------
console.log("\nPOST-WIPE STATE:")
for (const { table_name } of tables) {
  const { rows } = await db.query(`SELECT count(*)::int AS n FROM public."${table_name}"`)
  console.log(`  ${table_name}: ${rows[0].n}`)
}
const { data: after } = await admin.auth.admin.listUsers({ perPage: 500 })
console.log(`  auth users: ${after.users.length} (${after.users.map((u) => u.email).join(", ")})`)
const { rows: keptRoles } = await db.query(
  `SELECT role, status FROM public.user_roles WHERE user_id = $1`,
  [keep.id]
)
console.log(`  kept roles for ${KEEP_EMAIL}:`, keptRoles)

await db.end()
