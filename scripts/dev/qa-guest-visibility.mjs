// Temporary QA fixtures: a board reviewer and a role-less guest.
// Usage: node scripts/dev/qa-guest-visibility.mjs [--cleanup]
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const env = {}
for (const line of readFileSync(`${ROOT}/.env.local`, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const FIXTURES = [
  { email: "qa-board@resonance.test", name: "QA Board", role: "board_of_director" },
  { email: "qa-guest@resonance.test", name: "QA Guest", role: null },
]

const { data: list } = await admin.auth.admin.listUsers({ perPage: 500 })

if (process.argv.includes("--cleanup")) {
  for (const f of FIXTURES) {
    const u = list.users.find((x) => x.email === f.email)
    if (u) {
      await admin.auth.admin.deleteUser(u.id)
      console.log("deleted", f.email)
    }
  }
  process.exit(0)
}

for (const f of FIXTURES) {
  let user = list.users.find((x) => x.email === f.email)
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: f.email, password: "TestPortal!2026", email_confirm: true,
      user_metadata: { full_name: f.name },
    })
    if (error) throw error
    user = data.user
  }
  await admin.from("profiles").upsert({ id: user.id, full_name: f.name, email: f.email })
  if (f.role) {
    const { data: existing } = await admin.from("user_roles").select("id")
      .eq("user_id", user.id).eq("role", f.role).is("chapter_id", null).maybeSingle()
    if (!existing) {
      await admin.from("user_roles").insert({ user_id: user.id, chapter_id: null, role: f.role, status: "active" })
    }
  }
  console.log("ready:", f.email, f.role ?? "(guest, no roles)")
}
