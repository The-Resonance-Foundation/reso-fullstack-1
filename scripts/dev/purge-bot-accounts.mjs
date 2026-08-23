// One-time purge of spam/bot signups (2026-07 .. 2026-08 waves).
// An account is deleted ONLY if ALL of the following hold:
//   - email is not on the whitelist and not a test-*/seed-* account
//   - it has zero user_roles rows
//   - it has zero students (parent_user_id)
//   - it has zero applicants rows (converted_user_id or email)
//   - it is not a member of any conversation
//   - it has zero volunteer_hours and zero certificates
// Usage:
//   node scripts/dev/purge-bot-accounts.mjs           dry run (prints what would be deleted)
//   node scripts/dev/purge-bot-accounts.mjs --live    actually delete
//   BACKUP_PATH=<file.json>                           where to write the backup list
import { createClient } from "@supabase/supabase-js"
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const PROJECT_DIR = fileURLToPath(new URL("../..", import.meta.url))
function loadEnv(path) {
  const env = {}
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}
const env = loadEnv(`${PROJECT_DIR}/.env.local`)
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const LIVE = process.argv.includes("--live")
const BACKUP_PATH = process.env.BACKUP_PATH ?? `${PROJECT_DIR}/bot-purge-backup.json`

const WHITELIST = new Set([
  "pathakansh10@gmail.com",
  "anshparent1@gmail.com",
  "abc000cool@gmail.com",
  "anshkrishiv@gmail.com",
  "darsh.maharana@gmail.com",
  "pranay.aluri@gmail.com",
])
const isProtected = (email) =>
  !email ||
  WHITELIST.has(email.toLowerCase()) ||
  /^(test-|seed-)/i.test(email) ||
  email.toLowerCase().endsWith("@resonance.test")

async function listAllUsers() {
  const all = []
  let page = 1
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    all.push(...data.users)
    if (data.users.length < 200) break
    page++
  }
  return all
}

async function idsWithRows(table, column, ids) {
  const found = new Set()
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100)
    const { data, error } = await admin.from(table).select(column).in(column, chunk)
    if (error) throw error
    for (const row of data) found.add(row[column])
  }
  return found
}

const users = await listAllUsers()
console.log(`total auth users: ${users.length}`)

const candidates = users.filter((u) => !isProtected(u.email))
console.log(`after whitelist/test filter: ${candidates.length} candidates`)

const candIds = candidates.map((u) => u.id)
const withRoles = await idsWithRows("user_roles", "user_id", candIds)
const withStudents = await idsWithRows("students", "parent_user_id", candIds)
const withConvos = await idsWithRows("conversation_members", "user_id", candIds)
const withHours = await idsWithRows("volunteer_hours", "user_id", candIds)
const withCerts = await idsWithRows("certificates", "user_id", candIds)
const withApplicantsById = await idsWithRows("applicants", "converted_user_id", candIds)

// applicants can also be matched by email (pre-provision rows)
const candEmails = candidates.map((u) => u.email?.toLowerCase()).filter(Boolean)
const applicantEmails = new Set()
for (let i = 0; i < candEmails.length; i += 100) {
  const chunk = candEmails.slice(i, i + 100)
  const { data, error } = await admin.from("applicants").select("email").in("email", chunk)
  if (error) throw error
  for (const row of data) applicantEmails.add(row.email?.toLowerCase())
}

const toDelete = candidates.filter(
  (u) =>
    !withRoles.has(u.id) &&
    !withStudents.has(u.id) &&
    !withConvos.has(u.id) &&
    !withHours.has(u.id) &&
    !withCerts.has(u.id) &&
    !withApplicantsById.has(u.id) &&
    !applicantEmails.has(u.email?.toLowerCase())
)
const spared = candidates.filter((u) => !toDelete.includes(u))

console.log(`\nwould delete: ${toDelete.length}`)
console.log(`spared (has data/roles): ${spared.length}`)
for (const u of spared) console.log(`  spared: ${u.email}`)
console.log(`\nsample of deletions:`)
for (const u of toDelete.slice(0, 10)) console.log(`  ${u.email} (created ${u.created_at?.slice(0, 10)})`)

writeFileSync(
  BACKUP_PATH,
  JSON.stringify(
    toDelete.map((u) => ({ id: u.id, email: u.email, created_at: u.created_at, name: u.user_metadata?.full_name })),
    null,
    1
  )
)
console.log(`\nbackup list written to ${BACKUP_PATH}`)

if (!LIVE) {
  console.log("\nDRY RUN — nothing deleted. Re-run with --live to delete.")
  process.exit(0)
}

let ok = 0
let fail = 0
for (const u of toDelete) {
  const { error } = await admin.auth.admin.deleteUser(u.id)
  if (error) {
    fail++
    console.log(`  FAILED ${u.email}: ${error.message}`)
  } else {
    ok++
  }
}
console.log(`\ndeleted ${ok}, failed ${fail}`)

const remaining = await listAllUsers()
console.log(`auth users remaining: ${remaining.length}`)
for (const u of remaining) console.log(`  ${u.email}`)
