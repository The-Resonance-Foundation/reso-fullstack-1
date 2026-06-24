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
  `SELECT id, chapter_id, first_name, last_name FROM students WHERE status = 'active' LIMIT 3`
)
const tutors = await pgClient.query(
  `SELECT user_id, chapter_id FROM user_roles WHERE role = 'tutor' AND status = 'active' LIMIT 3`
)
console.log("students", students.rows)
console.log("tutors", tutors.rows)

if (students.rows[0] && tutors.rows[0]) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const student = students.rows[0]
  const tutor = tutors.rows.find((t) => t.chapter_id === student.chapter_id) ?? tutors.rows[0]

  const { data, error } = await admin
    .from("student_tutor_assignments")
    .upsert(
      {
        student_id: student.id,
        tutor_user_id: tutor.user_id,
        chapter_id: student.chapter_id,
        status: "active",
      },
      { onConflict: "student_id,tutor_user_id" }
    )
    .select("id")
    .maybeSingle()

  console.log("upsert result", { data, error })

  const check = await pgClient.query(`SELECT * FROM student_tutor_assignments`)
  console.log("after upsert rows", check.rows)
}

await pgClient.end()
