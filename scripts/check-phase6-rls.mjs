import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const raw = readFileSync(join(root, ".env.local"), "utf8")
for (const line of raw.split("\n")) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue
  const eq = trimmed.indexOf("=")
  if (eq === -1) continue
  process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1)
}

const expected = [
  "donations_select",
  "donations_update",
  "audit_logs_select",
  "audit_logs_insert",
]

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})
await client.connect()

const { rows } = await client.query(
  `SELECT policyname, tablename
   FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN ('donations', 'audit_logs', 'paypal_webhook_events')
   ORDER BY tablename, policyname`
)

console.log("Phase 6 policies:")
for (const row of rows) {
  console.log(`  ${row.tablename}.${row.policyname}`)
}

for (const name of expected) {
  if (!rows.some((row) => row.policyname === name)) {
    console.error(`Missing policy: ${name}`)
    process.exit(1)
  }
}

console.log("All expected policies present.")
await client.end()
