// Creates baseline test users (board admin + parent) in the Supabase project.
// Idempotent: skips users that already exist.
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

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

const PASSWORD = "TestPortal!2026"

const USERS = [
  { email: "test-board@resonance.test", name: "Belle Boardman", role: "board_of_director", chapterScoped: false },
  { email: "test-parent@resonance.test", name: "Pat Parent", role: "student_parent", chapterScoped: true },
]

async function findUserByEmail(email) {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (error) throw error
  return data.users.find((u) => u.email === email) ?? null
}

const { data: chapters, error: chErr } = await admin
  .from("chapters")
  .select("id, name, status")
  .eq("status", "active")
  .limit(1)
if (chErr) throw chErr
const chapter = chapters?.[0]
if (!chapter) throw new Error("No active chapter found — seed chapters first")
console.log(`Using chapter: ${chapter.name} (${chapter.id})`)

for (const spec of USERS) {
  let user = await findUserByEmail(spec.email)
  if (user) {
    console.log(`exists: ${spec.email} (${user.id})`)
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: spec.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: spec.name },
    })
    if (error) throw error
    user = data.user
    console.log(`created: ${spec.email} (${user.id})`)
  }

  // Ensure profile
  const { error: pErr } = await admin
    .from("profiles")
    .upsert({ id: user.id, full_name: spec.name }, { onConflict: "id" })
  if (pErr) throw pErr

  // Ensure active role
  const chapterId = spec.chapterScoped ? chapter.id : null
  let roleQuery = admin
    .from("user_roles")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("role", spec.role)
  roleQuery = chapterId === null ? roleQuery.is("chapter_id", null) : roleQuery.eq("chapter_id", chapterId)
  const { data: existingRole, error: rSelErr } = await roleQuery.maybeSingle()
  if (rSelErr) throw rSelErr
  if (!existingRole) {
    const { error: rErr } = await admin.from("user_roles").insert({
      user_id: user.id,
      role: spec.role,
      chapter_id: chapterId,
      status: "active",
    })
    if (rErr) throw rErr
    console.log(`  role granted: ${spec.role}${chapterId ? " @ " + chapter.name : " (org)"}`)
  } else if (existingRole.status !== "active") {
    const { error: rUpdErr } = await admin
      .from("user_roles")
      .update({ status: "active" })
      .eq("id", existingRole.id)
    if (rUpdErr) throw rUpdErr
    console.log(`  role activated: ${spec.role}`)
  } else {
    console.log(`  role ok: ${spec.role}`)
  }
}

console.log("\nDone. Password for all test users:", PASSWORD)
