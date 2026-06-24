import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"
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

const pgClient = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})
await pgClient.connect()

const students = await pgClient.query(
  `SELECT id, chapter_id, first_name, last_name, parent_user_id FROM students WHERE status = 'active'`
)
console.log("active students", students.rows)

const tutorUserId = "cdf4b5ee-a624-4ab4-92e0-f9dc10001158"
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

for (const student of students.rows) {
  const { data, error } = await admin
    .from("student_tutor_assignments")
    .upsert(
      {
        student_id: student.id,
        tutor_user_id: tutorUserId,
        chapter_id: student.chapter_id,
        status: "active",
      },
      { onConflict: "student_id,tutor_user_id" }
    )
    .select("id")
    .maybeSingle()
  console.log(`assign ${student.first_name}`, { data, error: error?.message })
}

const all = await pgClient.query(`SELECT * FROM student_tutor_assignments`)
console.log("all assignments", all.rows)

await pgClient.end()
