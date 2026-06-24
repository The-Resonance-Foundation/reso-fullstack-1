/**
 * Backfill tutor–student conversations for existing active assignments.
 *
 * Usage: node scripts/backfill-conversations.mjs
 */
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
try {
  const raw = readFileSync(join(root, ".env.local"), "utf8")
  for (const line of raw.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1)
  }
} catch {
  // .env.local optional when vars are already exported
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function ensureConversation({ studentId, tutorUserId, chapterId }) {
  const { data: student } = await admin
    .from("students")
    .select("parent_user_id")
    .eq("id", studentId)
    .maybeSingle()

  if (!student?.parent_user_id) {
    console.warn(`Skip ${studentId}: no parent`)
    return
  }

  const { data: existing } = await admin
    .from("conversations")
    .select("id")
    .eq("student_id", studentId)
    .eq("tutor_user_id", tutorUserId)
    .maybeSingle()

  let conversationId = existing?.id

  if (!conversationId) {
    const { data: created, error } = await admin
      .from("conversations")
      .insert({
        chapter_id: chapterId,
        student_id: studentId,
        tutor_user_id: tutorUserId,
        conversation_type: "tutor_student",
      })
      .select("id")
      .single()

    if (error) {
      console.error(`Create failed for student ${studentId}:`, error.message)
      return
    }
    conversationId = created.id
    console.log(`Created conversation ${conversationId}`)
  }

  for (const userId of [student.parent_user_id, tutorUserId]) {
    const { error } = await admin.from("conversation_members").upsert(
      { conversation_id: conversationId, user_id: userId },
      { onConflict: "conversation_id,user_id", ignoreDuplicates: true }
    )
    if (error) console.error(`Member upsert ${userId}:`, error.message)
  }
}

const { data: assignments, error } = await admin
  .from("student_tutor_assignments")
  .select("student_id, tutor_user_id, chapter_id")
  .eq("status", "active")

if (error) {
  console.error(error.message)
  process.exit(1)
}

console.log(`Processing ${assignments?.length ?? 0} active assignments...`)

for (const row of assignments ?? []) {
  if (!row.tutor_user_id) continue
  await ensureConversation({
    studentId: row.student_id,
    tutorUserId: row.tutor_user_id,
    chapterId: row.chapter_id,
  })
}

console.log("Done.")
