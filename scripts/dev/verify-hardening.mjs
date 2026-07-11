// Verifies the portal_hardening migration: email backfill, RLS status
// tightening, and new RPCs. Leaves no data behind.
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

let pass = 0
let fail = 0
function check(name, ok, detail = "") {
  if (ok) {
    pass++
    console.log(`  PASS ${name}`)
  } else {
    fail++
    console.log(`  FAIL ${name} ${detail}`)
  }
}

// 1. email backfill
const { data: profiles } = await admin
  .from("profiles")
  .select("email")
  .in("email", ["test-board@resonance.test", "test-parent@resonance.test"])
check("profiles.email backfilled", (profiles?.length ?? 0) === 2, JSON.stringify(profiles))

// Signed-in parent client (anon key → RLS applies)
const parentClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
const { data: parentAuth, error: loginErr } = await parentClient.auth.signInWithPassword({
  email: "test-parent@resonance.test",
  password: "TestPortal!2026",
})
check("parent login", !loginErr, loginErr?.message)

const { data: chapters } = await admin.from("chapters").select("id").limit(1)
const chapterId = chapters[0].id

// 2. RLS: parent cannot insert an already-active student
const { error: activeErr } = await parentClient.from("students").insert({
  parent_user_id: parentAuth.user.id,
  chapter_id: chapterId,
  first_name: "Hack",
  last_name: "Attempt",
  status: "active",
})
check("parent blocked from inserting active student", Boolean(activeErr), "insert unexpectedly succeeded")

// 3. RLS: pending insert works, then status flip is blocked by trigger
const { data: student, error: pendErr } = await parentClient
  .from("students")
  .insert({
    parent_user_id: parentAuth.user.id,
    chapter_id: chapterId,
    first_name: "Verify",
    last_name: "Kid",
    status: "pending",
  })
  .select("id")
  .single()
check("parent can insert pending student", !pendErr, pendErr?.message)

if (student) {
  const { error: flipErr } = await parentClient
    .from("students")
    .update({ status: "active" })
    .eq("id", student.id)
  check("parent blocked from self-activating student", Boolean(flipErr), "status flip succeeded")
  await admin.from("students").delete().eq("id", student.id)
}

// 4. RLS: volunteer_hours insert with status approved is blocked
//    (parent lacks the volunteer role anyway; check the error path exists)
const { error: vhErr } = await parentClient.from("volunteer_hours").insert({
  user_id: parentAuth.user.id,
  chapter_id: chapterId,
  category: "other",
  hours: 2,
  activity_date: "2026-07-01",
  description: "test",
  status: "approved",
})
check("self-approved volunteer hours blocked", Boolean(vhErr))

// 5. RPCs exist and respect RLS
const { data: totals, error: totalsErr } = await parentClient.rpc("get_donation_totals")
check(
  "get_donation_totals callable, hides data from parent",
  !totalsErr && Number(totals?.[0]?.completed_count ?? 0) === 0,
  totalsErr?.message ?? JSON.stringify(totals)
)

const { error: convErr } = await parentClient.rpc("get_conversation_last_messages", {
  p_conversation_ids: [],
})
check("get_conversation_last_messages callable", !convErr, convErr?.message)

// 6. availability overlap constraint exists (insert twice as admin)
const { data: tutorRow } = await admin.from("user_roles").select("user_id").eq("role", "tutor").limit(1)
const anyUser = tutorRow?.[0]?.user_id ?? parentAuth.user.id
const slot = {
  tutor_user_id: anyUser,
  chapter_id: chapterId,
  day_of_week: 6,
  start_time: "23:00",
  end_time: "23:30",
}
const { data: slot1, error: s1Err } = await admin
  .from("tutor_availability")
  .insert(slot)
  .select("id")
  .single()
const { error: s2Err } = await admin
  .from("tutor_availability")
  .insert({ ...slot, start_time: "23:15", end_time: "23:45" })
check(
  "overlapping availability blocked by exclusion constraint",
  !s1Err && Boolean(s2Err) && /exclusion|conflict/i.test(s2Err?.message ?? ""),
  `s1=${s1Err?.message} s2=${s2Err?.message}`
)
if (slot1) await admin.from("tutor_availability").delete().eq("id", slot1.id)

await parentClient.auth.signOut()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
