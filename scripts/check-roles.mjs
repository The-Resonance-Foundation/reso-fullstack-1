import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const env = readFileSync(join(root, ".env.local"), "utf8")
for (const line of env.split("\n")) {
  const t = line.trim()
  if (!t || t.startsWith("#")) continue
  const i = t.indexOf("=")
  if (i === -1) continue
  process.env[t.slice(0, i)] ??= t.slice(i + 1)
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const { data: users, error: usersError } = await admin.auth.admin.listUsers()
if (usersError) {
  console.error("listUsers:", usersError.message)
  process.exit(1)
}

console.log("=== Auth users ===")
for (const u of users.users) {
  console.log(`- ${u.email} (${u.id})`)
}

const { data: roles, error: rolesError } = await admin
  .from("user_roles")
  .select("user_id, role, chapter_id, status, profiles(full_name)")
  .order("role")

if (rolesError) {
  console.error("user_roles:", rolesError.message)
  process.exit(1)
}

console.log("\n=== user_roles ===")
for (const r of roles ?? []) {
  const user = users.users.find((u) => u.id === r.user_id)
  console.log(
    `- ${user?.email ?? r.user_id}: ${r.role} (${r.status}) chapter=${r.chapter_id ?? "org"}`
  )
}
