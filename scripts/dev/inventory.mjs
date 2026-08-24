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

const { data: list } = await admin.auth.admin.listUsers({ perPage: 500 })
console.log(`AUTH USERS: ${list.users.length}`)
for (const u of list.users) {
  const { data: roles } = await admin.from("user_roles").select("role, chapter_id, status").eq("user_id", u.id)
  const r = (roles ?? []).map((x) => `${x.role}${x.chapter_id ? "@ch" : ""}(${x.status})`).join(", ") || "no roles"
  console.log(`  ${u.email}  [${r}]  created ${u.created_at?.slice(0,10)}`)
}

const tables = ["chapters","profiles","user_roles","applicants","students","lessons","lesson_requests","sessions","availability","volunteer_hours","certificates","events","event_rsvps","event_attendance","announcements","resources","conversations","conversation_members","messages","notifications","donations","audit_logs","guardian_consents","tutor_assignments"]
console.log("\nTABLE COUNTS:")
for (const t of tables) {
  const { count, error } = await admin.from(t).select("*", { count: "exact", head: true })
  console.log(`  ${t}: ${error ? "n/a (" + error.message.slice(0,40) + ")" : count}`)
}

const { data: chapters } = await admin.from("chapters").select("name, slug, status")
console.log("\nCHAPTERS:", (chapters ?? []).map((c) => `${c.name} (${c.status})`).join("; "))

const { data: buckets } = await admin.storage.listBuckets()
console.log("\nSTORAGE BUCKETS:")
for (const b of buckets ?? []) {
  const { data: files } = await admin.storage.from(b.name).list("", { limit: 100 })
  console.log(`  ${b.name}: ${(files ?? []).length} top-level entries`)
}
