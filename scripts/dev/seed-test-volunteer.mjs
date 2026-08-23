// Creates test-volunteer@resonance.test with an org-level (chapterless)
// volunteer role, then inserts a pending corporate hour through RLS.
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

const email = "test-volunteer@resonance.test"
let { data: list } = await admin.auth.admin.listUsers({ perPage: 200 })
let user = list.users.find((u) => u.email === email)
if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email, password: "TestPortal!2026", email_confirm: true,
    user_metadata: { full_name: "Vera Volunteer" },
  })
  if (error) throw error
  user = data.user
  console.log("created", user.id)
} else console.log("exists", user.id)

await admin.from("profiles").upsert({ id: user.id, full_name: "Vera Volunteer", email })
const { data: existing } = await admin.from("user_roles").select("id")
  .eq("user_id", user.id).eq("role", "volunteer").is("chapter_id", null).maybeSingle()
if (!existing) {
  const { error } = await admin.from("user_roles").insert({
    user_id: user.id, chapter_id: null, role: "volunteer", status: "active",
  })
  if (error) throw error
  console.log("org volunteer role granted")
} else console.log("role exists")

// Insert a corporate hour AS THE VOLUNTEER (RLS enforced): magiclink session
const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email })
if (linkErr) throw linkErr
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const { data: sess, error: otpErr } = await anon.auth.verifyOtp({
  type: "magiclink", token_hash: linkData.properties.hashed_token,
})
if (otpErr) throw otpErr
const { data: hour, error: insErr } = await anon.from("volunteer_hours").insert({
  user_id: sess.user.id, chapter_id: null, category: "event_support",
  hours: 3.5, activity_date: "2026-08-20",
  description: "Corporate benefit concert setup", status: "pending",
}).select("id").single()
if (insErr) throw insErr
console.log("corporate hour inserted via RLS:", hour.id)
