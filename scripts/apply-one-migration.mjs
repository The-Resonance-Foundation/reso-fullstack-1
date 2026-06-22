/** Apply a single migration file by name. Usage: node scripts/apply-one-migration.mjs 20250622000004_applicant_rejected_stage.sql */
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const file = process.argv[2]
if (!file) {
  console.error("Usage: node scripts/apply-one-migration.mjs <filename.sql>")
  process.exit(1)
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const t = line.trim()
  if (!t || t.startsWith("#")) continue
  const i = t.indexOf("=")
  if (i === -1) continue
  process.env[t.slice(0, i)] ??= t.slice(i + 1)
}

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
const sql = readFileSync(join(root, "supabase/migrations", file), "utf8")
await client.query(sql)
console.log(`Applied ${file}`)
await client.end()
