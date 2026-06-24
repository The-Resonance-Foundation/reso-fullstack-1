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

const c = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})
await c.connect()

const assigns = await c.query(`
  SELECT sta.id, sta.student_id, sta.tutor_user_id, sta.status,
         s.first_name, s.last_name, s.parent_user_id
  FROM student_tutor_assignments sta
  JOIN students s ON s.id = sta.student_id
  ORDER BY sta.created_at
`)
console.log("assignments:", assigns.rows)

const convs = await c.query(
  `SELECT id, student_id, tutor_user_id FROM conversations`
)
console.log("conversations:", convs.rows)

const members = await c.query(
  `SELECT conversation_id, user_id FROM conversation_members`
)
console.log("members:", members.rows)

await c.end()
