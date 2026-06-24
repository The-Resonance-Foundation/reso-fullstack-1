import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const raw = readFileSync(join(root, ".env.local"), "utf8")
for (const line of raw.split("\n")) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue
  const eq = trimmed.indexOf("=")
  if (eq === -1) continue
  process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1)
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const studentId = "bef0684f-a62e-42ef-9f5f-72c66018e4f2"
const tutorUserId = "cdf4b5ee-a624-4ab4-92e0-f9dc10001158"

const { data: student } = await admin
  .from("students")
  .select("parent_user_id, chapter_id")
  .eq("id", studentId)
  .maybeSingle()
console.log("student", student)

const { data: created, error } = await admin
  .from("conversations")
  .insert({
    chapter_id: student.chapter_id,
    student_id: studentId,
    tutor_user_id: tutorUserId,
    conversation_type: "tutor_student",
  })
  .select("id")
  .single()

console.log("insert conversation", { created, error })

if (created) {
  for (const userId of [student.parent_user_id, tutorUserId]) {
    const { error: memberError } = await admin.from("conversation_members").upsert(
      { conversation_id: created.id, user_id: userId },
      { onConflict: "conversation_id,user_id", ignoreDuplicates: true }
    )
    console.log("member", userId, memberError?.message ?? "ok")
  }
}
