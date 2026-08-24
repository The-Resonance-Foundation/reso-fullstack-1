// Temporary fixtures for handbook screenshots. All removed with --cleanup.
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

const USERS = [
  { email: "qa-corporate@resonance.test", name: "Casey Rivera", role: "corporate_officer", chapter: false },
  { email: "qa-pa@resonance.test", name: "Priya Anand", role: "program_administrator", chapter: false },
  { email: "qa-tutor@resonance.test", name: "Tyler Nguyen", role: "tutor", chapter: true },
  { email: "qa-parent@resonance.test", name: "Morgan Lee", role: "student_parent", chapter: true },
]

const { data: list } = await admin.auth.admin.listUsers({ perPage: 500 })

if (process.argv.includes("--cleanup")) {
  // content first, then chapter, then users (user delete cascades their rows)
  for (const u of USERS) {
    const found = list.users.find((x) => x.email === u.email)
    if (found) {
      await admin.auth.admin.deleteUser(found.id)
      console.log("deleted", u.email)
    }
  }
  const { data: ch } = await admin.from("chapters").select("id").eq("slug", "frisco-qa").maybeSingle()
  if (ch) {
    for (const t of ["announcements", "events", "tutor_availability", "students", "volunteer_hours"]) {
      await admin.from(t).delete().eq("chapter_id", ch.id)
    }
    await admin.from("events").delete().is("chapter_id", null).eq("title", "Winter Community Showcase")
    await admin.from("announcements").delete().is("chapter_id", null).eq("title", "Welcome to the spring semester")
    await admin.from("chapters").delete().eq("id", ch.id)
    console.log("deleted chapter + content")
  }
  process.exit(0)
}

// chapter
let { data: chapter } = await admin.from("chapters").select("id").eq("slug", "frisco-qa").maybeSingle()
if (!chapter) {
  const { data, error } = await admin.from("chapters")
    .insert({ name: "Frisco", slug: "frisco-qa", city: "Frisco", state: "TX", status: "active" })
    .select("id").single()
  if (error) throw error
  chapter = data
}
console.log("chapter:", chapter.id)

const ids = {}
for (const u of USERS) {
  let user = list.users.find((x) => x.email === u.email)
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email, password: "TestPortal!2026", email_confirm: true,
      user_metadata: { full_name: u.name },
    })
    if (error) throw error
    user = data.user
  }
  ids[u.role] = user.id
  await admin.from("profiles").upsert({ id: user.id, full_name: u.name, email: u.email })
  const chapterId = u.chapter ? chapter.id : null
  let q = admin.from("user_roles").select("id").eq("user_id", user.id).eq("role", u.role)
  q = chapterId ? q.eq("chapter_id", chapterId) : q.is("chapter_id", null)
  const { data: existing } = await q.maybeSingle()
  if (!existing) {
    await admin.from("user_roles").insert({ user_id: user.id, chapter_id: chapterId, role: u.role, status: "active" })
  }
  console.log("ready:", u.email)
}

// tutor availability (Mon/Wed/Sat)
await admin.from("tutor_availability").delete().eq("tutor_user_id", ids.tutor)
await admin.from("tutor_availability").insert([
  { tutor_user_id: ids.tutor, chapter_id: chapter.id, day_of_week: 1, start_time: "16:30", end_time: "18:30" },
  { tutor_user_id: ids.tutor, chapter_id: chapter.id, day_of_week: 3, start_time: "17:00", end_time: "19:00" },
  { tutor_user_id: ids.tutor, chapter_id: chapter.id, day_of_week: 6, start_time: "10:00", end_time: "13:00" },
])

// parent's students (one active, one pending for the review screenshots)
await admin.from("students").delete().eq("parent_user_id", ids.student_parent)
await admin.from("students").insert([
  { parent_user_id: ids.student_parent, chapter_id: chapter.id, first_name: "Ava", last_name: "Lee", instrument: "Flute", skill_level: "beginner", financial_aid: false, status: "active" },
  { parent_user_id: ids.student_parent, chapter_id: chapter.id, first_name: "Ethan", last_name: "Lee", instrument: "Violin", skill_level: "intermediate", financial_aid: false, status: "pending" },
])

// events: one org-wide (corporate's world) + one chapter event
const in3w = new Date(Date.now() + 21 * 864e5)
const in5w = new Date(Date.now() + 35 * 864e5)
await admin.from("events").insert([
  { chapter_id: null, title: "Winter Community Showcase", description: "Our organization wide winter concert. All chapters, all instruments, one stage.", location: "Frisco Community Center", starts_at: in5w.toISOString(), ends_at: new Date(in5w.getTime() + 2 * 36e5).toISOString(), status: "published", created_by: ids.corporate_officer },
  { chapter_id: chapter.id, title: "Frisco Fall Recital", description: "Students perform for family and friends.", location: "Frisco Public Library", starts_at: in3w.toISOString(), ends_at: new Date(in3w.getTime() + 2 * 36e5).toISOString(), status: "published", created_by: ids.program_administrator },
])

// announcement (org-wide)
await admin.from("announcements").insert({
  chapter_id: null, title: "Welcome to the spring semester",
  body: "Lessons resume this week. Check the calendar for your schedule, and remember that every lesson is completely free.",
  published_at: new Date().toISOString(), created_by: ids.program_administrator,
})

// pending volunteer hours (for PA approvals queue screenshot)
await admin.from("volunteer_hours").insert({
  user_id: ids.tutor, chapter_id: chapter.id, category: "teaching",
  hours: 2.5, activity_date: new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10),
  description: "Saturday group flute lessons", status: "pending",
})

console.log("seed complete")
