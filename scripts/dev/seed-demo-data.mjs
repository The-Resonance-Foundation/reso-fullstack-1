// Realistic demo/test data seeder for the live Supabase project.
// Idempotent: safe to re-run (check-before-insert everywhere).
// Usage:
//   node scripts/dev/seed-demo-data.mjs            seed demo data
//   node scripts/dev/seed-demo-data.mjs --wipe      delete all seeded data
//
// All seeded users use emails like seed-<slug>@resonance.test — that domain +
// prefix combination is what marks a row for wipe. test-board@resonance.test
// and test-parent@resonance.test (from seed-test-users.mjs) are never touched.
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
const WIPE = process.argv.includes("--wipe")

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick(arr) {
  return arr[rand(0, arr.length - 1)]
}
function isoDate(date) {
  return date.toISOString().slice(0, 10)
}
function isSeedEmail(email) {
  return typeof email === "string" && /^seed-.*@resonance\.test$/i.test(email)
}
function combineDateTime(date, timeStr) {
  const [h, m] = timeStr.split(":").map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d
}
// Most recent date strictly before `fromDate` whose JS getDay() === dow.
function mostRecentDowBefore(dow, fromDate) {
  const d = new Date(fromDate)
  let diff = (d.getDay() - dow + 7) % 7
  if (diff === 0) diff = 7
  d.setDate(d.getDate() - diff)
  return d
}
// Smallest date strictly after `fromDate` whose JS getDay() === dow.
function nextDowAfter(dow, fromDate) {
  const d = new Date(fromDate)
  let diff = (dow - d.getDay() + 7) % 7
  if (diff === 0) diff = 7
  d.setDate(d.getDate() + diff)
  return d
}
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function listAllUsers() {
  const all = []
  let page = 1
  const perPage = 200
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    all.push(...data.users)
    if (data.users.length < perPage) break
    page++
  }
  return all
}

async function countWhere(table, column, values) {
  if (!values || values.length === 0) return 0
  // select("*") rather than "id" — conversation_members has no id column
  // (composite PK), so a fixed column name would break on that table.
  const { count, error } = await admin
    .from(table)
    .select("*", { count: "exact", head: true })
    .in(column, values)
  if (error) throw error
  return count ?? 0
}

// ===========================================================================
// WIPE
// ===========================================================================

async function wipe() {
  console.log("Wiping seed data (seed-*@resonance.test)...\n")

  const allUsers = await listAllUsers()
  const seedUsers = allUsers.filter((u) => isSeedEmail(u.email))
  const seedUserIds = seedUsers.map((u) => u.id)
  console.log(`Found ${seedUsers.length} seed users`)

  if (seedUserIds.length > 0) {
    // events / announcements have ON DELETE SET NULL on created_by, so they
    // must be removed explicitly before the users are deleted.
    const { data: evs, error: evErr } = await admin
      .from("events")
      .select("id")
      .in("created_by", seedUserIds)
    if (evErr) throw evErr
    if (evs?.length) {
      const { error } = await admin
        .from("events")
        .delete()
        .in(
          "id",
          evs.map((e) => e.id)
        )
      if (error) throw error
      console.log(`  deleted ${evs.length} events (+ cascaded rsvps/attendance)`)
    }

    const { data: anns, error: annErr } = await admin
      .from("announcements")
      .select("id")
      .in("created_by", seedUserIds)
    if (annErr) throw annErr
    if (anns?.length) {
      const { error } = await admin
        .from("announcements")
        .delete()
        .in(
          "id",
          anns.map((a) => a.id)
        )
      if (error) throw error
      console.log(`  deleted ${anns.length} announcements`)
    }
  }

  const { data: dons, error: donErr } = await admin.from("donations").select("id").eq("notes", "SEED")
  if (donErr) throw donErr
  if (dons?.length) {
    const { error } = await admin.from("donations").delete().eq("notes", "SEED")
    if (error) throw error
    console.log(`  deleted ${dons.length} donations`)
  }

  const { data: apps, error: appErr } = await admin.from("applicants").select("id, email")
  if (appErr) throw appErr
  const seedApps = (apps ?? []).filter((a) => isSeedEmail(a.email))
  if (seedApps.length) {
    const { error } = await admin
      .from("applicants")
      .delete()
      .in(
        "id",
        seedApps.map((a) => a.id)
      )
    if (error) throw error
    console.log(`  deleted ${seedApps.length} applicants`)
  }

  // Deleting the auth user cascades: profiles, user_roles, students (and
  // everything hanging off students: guardian_consents, assignments,
  // lessons -> lesson_logs, practice_logs, homework assignments,
  // conversations -> conversation_members/messages, resources),
  // tutor_availability, remaining event_rsvps/event_attendance,
  // volunteer_hours.
  for (const u of seedUsers) {
    const { error } = await admin.auth.admin.deleteUser(u.id)
    if (error) console.error(`  FAILED to delete user ${u.email}: ${error.message}`)
    else console.log(`  deleted user ${u.email}`)
  }

  console.log("\nWipe complete.")
}

// ===========================================================================
// SEED
// ===========================================================================

async function ensureUser(userMap, { email, fullName, metadata = {} }) {
  let user = userMap.get(email)
  if (user) return { user, created: false }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, ...metadata },
  })
  if (error) throw error
  user = data.user
  userMap.set(email, user)
  return { user, created: true }
}

async function ensureProfile(userId, fullName, email) {
  const { error } = await admin
    .from("profiles")
    .upsert({ id: userId, full_name: fullName, email }, { onConflict: "id" })
  if (error) throw error
}

async function ensureRole(userId, role, chapterId) {
  let q = admin.from("user_roles").select("id, status").eq("user_id", userId).eq("role", role)
  q = chapterId === null ? q.is("chapter_id", null) : q.eq("chapter_id", chapterId)
  const { data, error } = await q.maybeSingle()
  if (error) throw error
  if (!data) {
    const { error: insErr } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role, chapter_id: chapterId, status: "active" })
    if (insErr) throw insErr
    return "created"
  }
  if (data.status !== "active") {
    const { error: updErr } = await admin.from("user_roles").update({ status: "active" }).eq("id", data.id)
    if (updErr) throw updErr
    return "activated"
  }
  return "ok"
}

async function ensureStudent(parentId, chapterId, spec) {
  const { data: existing, error } = await admin
    .from("students")
    .select("id, status")
    .eq("parent_user_id", parentId)
    .eq("first_name", spec.firstName)
    .eq("last_name", spec.lastName)
    .maybeSingle()
  if (error) throw error
  if (existing) return { id: existing.id, created: false }
  const { data, error: insErr } = await admin
    .from("students")
    .insert({
      parent_user_id: parentId,
      chapter_id: chapterId,
      first_name: spec.firstName,
      last_name: spec.lastName,
      instrument: spec.instrument,
      skill_level: spec.skillLevel,
      status: spec.status,
    })
    .select("id")
    .single()
  if (insErr) throw insErr
  return { id: data.id, created: true }
}

async function ensureAssignment(studentId, tutorId, chapterId) {
  const { data: existing, error } = await admin
    .from("student_tutor_assignments")
    .select("id")
    .eq("student_id", studentId)
    .maybeSingle()
  if (error) throw error
  if (existing) return { id: existing.id, created: false }
  const { data, error: insErr } = await admin
    .from("student_tutor_assignments")
    .insert({ student_id: studentId, tutor_user_id: tutorId, chapter_id: chapterId, status: "active" })
    .select("id")
    .single()
  if (insErr) throw insErr
  return { id: data.id, created: true }
}

async function ensureAvailability(tutorId, chapterId, slots) {
  const { data: existing, error } = await admin
    .from("tutor_availability")
    .select("id")
    .eq("tutor_user_id", tutorId)
  if (error) throw error
  if (existing && existing.length > 0) return 0
  let created = 0
  for (const slot of slots) {
    const { error: insErr } = await admin.from("tutor_availability").insert({
      tutor_user_id: tutorId,
      chapter_id: chapterId,
      day_of_week: slot.day,
      start_time: slot.start,
      end_time: slot.end,
    })
    if (insErr) throw insErr
    created++
  }
  return created
}

const TOPIC_POOL = [
  "Scales and arpeggios, sight-reading",
  "New repertoire introduction",
  "Rhythm and timing exercises",
  "Music theory review",
  "Recital piece refinement",
  "Technique and posture",
]
const NOTES_POOL = [
  "Great improvement this week.",
  "Needs more practice on timing.",
  "Ready to move to next piece.",
  "Solid progress, keep it up.",
  "Focus on dynamics next session.",
]

async function ensureLessonsForAssignment({ studentId, tutorId, chapterId, dow, startTime, endTime }) {
  const { data: existing, error } = await admin
    .from("lessons")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("tutor_user_id", tutorId)
  if (error) throw error
  if (existing && existing.length >= 8) {
    return { createdLessons: 0, createdLogs: 0 }
  }

  const today = new Date()
  const pastDates = []
  let cursor = mostRecentDowBefore(dow, today)
  for (let i = 0; i < 6; i++) {
    pastDates.push(new Date(cursor))
    cursor.setDate(cursor.getDate() - 7)
  }
  const futureDates = []
  let fcursor = nextDowAfter(dow, today)
  futureDates.push(new Date(fcursor))
  fcursor = new Date(fcursor)
  fcursor.setDate(fcursor.getDate() + 7)
  futureDates.push(new Date(fcursor))

  let createdLessons = 0
  let createdLogs = 0

  for (const date of pastDates) {
    const { data, error: insErr } = await admin
      .from("lessons")
      .insert({
        chapter_id: chapterId,
        tutor_user_id: tutorId,
        student_id: studentId,
        scheduled_start: combineDateTime(date, startTime).toISOString(),
        scheduled_end: combineDateTime(date, endTime).toISOString(),
        status: "completed",
        created_by: tutorId,
      })
      .select("id")
      .single()
    if (insErr) throw insErr
    createdLessons++

    if (Math.random() < 0.7) {
      const { error: logErr } = await admin.from("lesson_logs").insert({
        lesson_id: data.id,
        attendance: "present",
        topics_covered: pick(TOPIC_POOL),
        tutor_notes: pick(NOTES_POOL),
        created_by: tutorId,
      })
      if (logErr) throw logErr
      createdLogs++
    }
  }

  for (const date of futureDates) {
    const { error: insErr } = await admin.from("lessons").insert({
      chapter_id: chapterId,
      tutor_user_id: tutorId,
      student_id: studentId,
      scheduled_start: combineDateTime(date, startTime).toISOString(),
      scheduled_end: combineDateTime(date, endTime).toISOString(),
      status: "scheduled",
      created_by: tutorId,
    })
    if (insErr) throw insErr
    createdLessons++
  }

  return { createdLessons, createdLogs }
}

const PRACTICE_NOTES = [
  "Worked on scales and warm-ups.",
  "Practiced recital piece.",
  "Focused on sight-reading.",
  "Worked on rhythm exercises.",
  "Reviewed new assignment.",
  "Practiced with metronome.",
]

async function ensurePracticeLogs(studentId, parentId) {
  const { count, error } = await admin
    .from("practice_logs")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
  if (error) throw error
  if ((count ?? 0) > 0) return 0
  const n = rand(5, 20)
  for (let i = 0; i < n; i++) {
    const date = new Date()
    date.setDate(date.getDate() - rand(0, 30))
    const { error: insErr } = await admin.from("practice_logs").insert({
      student_id: studentId,
      minutes: rand(10, 60),
      practiced_on: isoDate(date),
      notes: pick(PRACTICE_NOTES),
      logged_by: parentId,
    })
    if (insErr) throw insErr
  }
  return n
}

const ASSIGNMENT_TITLES = [
  "Scale Practice - G Major",
  "Sight Reading Packet",
  "Recital Piece Memorization",
  "Rhythm Workbook Ch. 3",
  "Ear Training Exercises",
  "Repertoire: New Piece Introduction",
]
const ASSIGNMENT_DESCRIPTIONS = [
  "Practice slowly with a metronome at 60 BPM, increase gradually.",
  "Complete the assigned pages and mark any tricky measures.",
  "Memorize the first section for next lesson.",
  "Focus on clean articulation and dynamics.",
  "Review theory concepts covered in class.",
]
const ASSIGNMENT_STATUSES = ["assigned", "submitted", "completed"]

async function ensureAssignments(studentId, tutorId) {
  const { count, error } = await admin
    .from("assignments")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
  if (error) throw error
  if ((count ?? 0) > 0) return 0
  const n = rand(1, 3)
  let created = 0
  for (let i = 0; i < n; i++) {
    const hasDue = Math.random() < 0.6
    let due = null
    if (hasDue) {
      const d = new Date()
      d.setDate(d.getDate() + rand(-10, 20))
      due = isoDate(d)
    }
    const { error: insErr } = await admin.from("assignments").insert({
      student_id: studentId,
      tutor_user_id: tutorId,
      title: pick(ASSIGNMENT_TITLES),
      description: pick(ASSIGNMENT_DESCRIPTIONS),
      due_date: due,
      status: pick(ASSIGNMENT_STATUSES),
    })
    if (insErr) throw insErr
    created++
  }
  return created
}

async function ensureEvent(spec) {
  const { data: existing, error } = await admin.from("events").select("id").eq("title", spec.title).maybeSingle()
  if (error) throw error
  if (existing) return { id: existing.id, created: false }
  const { data, error: insErr } = await admin
    .from("events")
    .insert({
      chapter_id: spec.chapterId,
      title: spec.title,
      description: spec.description,
      location: spec.location,
      starts_at: spec.startsAt.toISOString(),
      ends_at: spec.endsAt.toISOString(),
      capacity: spec.capacity ?? null,
      status: spec.status,
      created_by: spec.createdBy,
    })
    .select("id")
    .single()
  if (insErr) throw insErr
  return { id: data.id, created: true }
}

async function ensureRsvp(eventId, userId, status) {
  const { data: existing, error } = await admin
    .from("event_rsvps")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw error
  if (existing) return false
  const { error: insErr } = await admin.from("event_rsvps").insert({ event_id: eventId, user_id: userId, status })
  if (insErr) throw insErr
  return true
}

async function ensureAttendance(eventId, userId, recordedBy) {
  const { data: existing, error } = await admin
    .from("event_attendance")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw error
  if (existing) return false
  const { error: insErr } = await admin
    .from("event_attendance")
    .insert({ event_id: eventId, user_id: userId, recorded_by: recordedBy })
  if (insErr) throw insErr
  return true
}

const VH_CATEGORIES = ["teaching", "event_support", "admin_work"]
const VH_DESCRIPTIONS = [
  "Assisted with weekly lesson coverage.",
  "Helped set up for chapter event.",
  "Supported front-desk check-in.",
  "Organized instrument inventory.",
  "Assisted with newsletter mailing.",
  "Chaperoned recital rehearsal.",
]
const VH_REJECTION_REASONS = [
  "Hours could not be verified against chapter schedule.",
  "Duplicate entry for already-logged activity.",
  "Missing description of activity performed.",
]

async function ensureVolunteerHoursForUser(userId, chapterId, targetCount, statusPool, presidentId) {
  const { count, error } = await admin
    .from("volunteer_hours")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
  if (error) throw error
  const existing = count ?? 0
  if (existing >= targetCount) return 0
  let created = 0
  for (let i = existing; i < targetCount; i++) {
    const status = statusPool.length > 0 ? statusPool.pop() : "approved"
    const activityDate = new Date()
    activityDate.setDate(activityDate.getDate() - rand(0, 60))
    const row = {
      user_id: userId,
      chapter_id: chapterId,
      category: pick(VH_CATEGORIES),
      hours: rand(2, 8) / 2,
      activity_date: isoDate(activityDate),
      description: pick(VH_DESCRIPTIONS),
      status,
    }
    if (status === "approved") {
      const approvedAt = new Date(Math.min(Date.now(), activityDate.getTime() + rand(1, 5) * 86400000))
      row.approved_by = presidentId
      row.approved_at = approvedAt.toISOString()
    } else if (status === "rejected") {
      const rejectedAt = new Date(Math.min(Date.now(), activityDate.getTime() + rand(1, 5) * 86400000))
      row.rejected_by = presidentId
      row.rejected_at = rejectedAt.toISOString()
      row.rejection_reason = pick(VH_REJECTION_REASONS)
    }
    const { error: insErr } = await admin.from("volunteer_hours").insert(row)
    if (insErr) throw insErr
    created++
  }
  return created
}

async function ensureAnnouncement(spec) {
  const { data: existing, error } = await admin
    .from("announcements")
    .select("id")
    .eq("title", spec.title)
    .maybeSingle()
  if (error) throw error
  if (existing) return false
  const { error: insErr } = await admin.from("announcements").insert({
    chapter_id: spec.chapterId,
    title: spec.title,
    body: spec.body,
    published_at: spec.publishedAt.toISOString(),
    created_by: spec.createdBy,
  })
  if (insErr) throw insErr
  return true
}

async function ensureConversation(studentId, tutorId, chapterId) {
  const { data: existing, error } = await admin
    .from("conversations")
    .select("id")
    .eq("student_id", studentId)
    .eq("tutor_user_id", tutorId)
    .maybeSingle()
  if (error) throw error
  if (existing) return existing.id
  const { data, error: insErr } = await admin
    .from("conversations")
    .insert({ chapter_id: chapterId, student_id: studentId, tutor_user_id: tutorId })
    .select("id")
    .single()
  if (insErr) throw insErr
  return data.id
}

async function ensureConversationMember(conversationId, userId) {
  const { data: existing, error } = await admin
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw error
  if (existing) return false
  const { error: insErr } = await admin
    .from("conversation_members")
    .insert({ conversation_id: conversationId, user_id: userId })
  if (insErr) throw insErr
  return true
}

const TUTOR_MSGS = [
  "Hi! Just a note that this week's lesson went really well.",
  "Reminder: our next lesson is coming up — let me know if the time still works.",
  "Please review the new assignment before our next session.",
  "Great progress on the rhythm exercises today!",
  "Let me know if you have any questions about the practice notes.",
]
const PARENT_MSGS = [
  "Thank you so much for the update!",
  "We'll make sure to practice this week.",
  "Is it possible to reschedule next week's lesson?",
  "They really enjoyed today's lesson.",
  "Appreciate all your help — see you next week.",
  "Quick question about the recital piece, do you have a minute?",
]

async function ensureMessages(conversationId, tutorId, parentId) {
  const { count, error } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
  if (error) throw error
  if ((count ?? 0) > 0) return 0
  const n = rand(4, 10)
  for (let i = 0; i < n; i++) {
    const sender = i % 2 === 0 ? tutorId : parentId
    const daysAgo = 14 - Math.round((i / (n - 1 || 1)) * 14)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    date.setHours(rand(8, 20), rand(0, 59), 0, 0)
    const body = sender === tutorId ? pick(TUTOR_MSGS) : pick(PARENT_MSGS)
    const { error: insErr } = await admin.from("messages").insert({
      conversation_id: conversationId,
      sender_id: sender,
      body,
      created_at: date.toISOString(),
    })
    if (insErr) throw insErr
  }
  return n
}

function dateInMonthsAgo(monthsAgo) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() - monthsAgo
  let d = new Date(year, month, rand(1, 28), rand(8, 20), rand(0, 59))
  if (d > now) d = new Date(now.getTime() - rand(0, 5) * 86400000)
  return d
}

async function ensureDonation(n, spec) {
  const capId = `SEEDCAP-${n}`
  const { data: existing, error } = await admin
    .from("donations")
    .select("id")
    .eq("paypal_capture_id", capId)
    .maybeSingle()
  if (error) throw error
  if (existing) return false
  const { error: insErr } = await admin.from("donations").insert({
    chapter_id: spec.chapterId,
    amount: spec.amount,
    status: "completed",
    source: spec.source,
    paypal_capture_id: capId,
    payer_email: spec.payerEmail,
    payer_name: spec.payerName,
    donated_at: spec.donatedAt.toISOString(),
    notes: "SEED",
    recorded_by: spec.recordedBy ?? null,
    net_amount: spec.netAmount ?? null,
    fee_amount: spec.feeAmount ?? null,
  })
  if (insErr) throw insErr
  return true
}

async function ensureApplicant(spec) {
  const { data: existing, error } = await admin
    .from("applicants")
    .select("id")
    .eq("email", spec.email)
    .maybeSingle()
  if (error) throw error
  if (existing) return false
  const { error: insErr } = await admin.from("applicants").insert({
    type: spec.type,
    chapter_id: spec.chapterId,
    full_name: spec.fullName,
    email: spec.email,
    phone: spec.phone ?? null,
    instrument: spec.instrument ?? null,
    skill_level: spec.skillLevel ?? null,
    message: spec.message ?? null,
    stage: spec.stage,
    requested_role: spec.requestedRole ?? null,
  })
  if (insErr) throw insErr
  return true
}

// ---------------------------------------------------------------------------
// Data pools
// ---------------------------------------------------------------------------

const PARENT_NAMES = [
  "Maria Alvarez",
  "James Chen",
  "Priya Nair",
  "Robert Kim",
  "Angela Turner",
  "David Okafor",
  "Linda Nguyen",
  "Marcus Bell",
  "Sofia Rossi",
  "Kevin Park",
  "Natalie Brooks",
  "Andre Dupont",
]

const TUTOR_SPECS = [
  { name: "Rachel Kim", instrument: "Piano" },
  { name: "Thomas Hayes", instrument: "Guitar" },
  { name: "Emily Sato", instrument: "Violin" },
  { name: "Daniel Osei", instrument: "Cello" },
  { name: "Grace Liu", instrument: "Voice" },
]

const VOLUNTEER_NAMES = ["Olivia Martinez", "Brian Foster", "Jasmine Carter"]

// tutor_availability: day 0=Sun..6=Sat. Distinct days per tutor so the GiST
// exclusion constraint (same tutor + same day + overlapping range) never
// fires between our own seeded slots.
const TUTOR_AVAILABILITY = [
  [
    { day: 1, start: "16:00", end: "18:00" },
    { day: 3, start: "15:30", end: "17:00" },
  ],
  [
    { day: 2, start: "15:00", end: "17:00" },
    { day: 4, start: "16:00", end: "17:30" },
    { day: 6, start: "10:00", end: "12:00" },
  ],
  [
    { day: 1, start: "17:00", end: "19:00" },
    { day: 3, start: "17:00", end: "18:30" },
    { day: 5, start: "15:00", end: "16:30" },
  ],
  [
    { day: 2, start: "16:30", end: "18:00" },
    { day: 4, start: "15:00", end: "16:00" },
  ],
  [
    { day: 3, start: "16:00", end: "18:00" },
    { day: 5, start: "16:00", end: "17:30" },
    { day: 6, start: "09:00", end: "11:00" },
    { day: 0, start: "13:00", end: "15:00" },
  ],
]

const SKILL_LEVELS = ["beginner", "intermediate", "advanced"]

// 12 parents, 18 students total (6 parents w/ 2 kids, 6 w/ 1 kid).
// 14 active, 3 pending, 1 rejected.
const STUDENT_SPECS = [
  { parentIdx: 0, firstName: "Emma", lastName: "Alvarez", instrument: "Piano", status: "active" },
  { parentIdx: 0, firstName: "Lucas", lastName: "Alvarez", instrument: "Violin", status: "active" },
  { parentIdx: 1, firstName: "Noah", lastName: "Chen", instrument: "Guitar", status: "active" },
  { parentIdx: 2, firstName: "Aisha", lastName: "Nair", instrument: "Voice", status: "active" },
  { parentIdx: 2, firstName: "Dev", lastName: "Nair", instrument: "Drums", status: "pending" },
  { parentIdx: 3, firstName: "Ethan", lastName: "Kim", instrument: "Cello", status: "active" },
  { parentIdx: 4, firstName: "Zoe", lastName: "Turner", instrument: "Piano", status: "active" },
  { parentIdx: 5, firstName: "Jaden", lastName: "Okafor", instrument: "Guitar", status: "active" },
  { parentIdx: 5, firstName: "Maya", lastName: "Okafor", instrument: "Flute", status: "active" },
  { parentIdx: 6, firstName: "Lily", lastName: "Nguyen", instrument: "Violin", status: "pending" },
  { parentIdx: 7, firstName: "Marcus", lastName: "Bell Jr.", instrument: "Drums", status: "active" },
  { parentIdx: 8, firstName: "Isabella", lastName: "Rossi", instrument: "Piano", status: "active" },
  { parentIdx: 8, firstName: "Leo", lastName: "Rossi", instrument: "Guitar", status: "rejected" },
  { parentIdx: 9, firstName: "Owen", lastName: "Park", instrument: "Cello", status: "active" },
  { parentIdx: 10, firstName: "Chloe", lastName: "Brooks", instrument: "Voice", status: "active" },
  { parentIdx: 10, firstName: "Ava", lastName: "Brooks", instrument: "Flute", status: "pending" },
  { parentIdx: 11, firstName: "Mateo", lastName: "Dupont", instrument: "Piano", status: "active" },
  { parentIdx: 11, firstName: "Elena", lastName: "Dupont", instrument: "Violin", status: "active" },
]

const EVENT_DESCRIPTIONS = {
  recital: "An evening celebrating student progress with a chapter-wide recital performance.",
  volunteer: "Thank-you gathering for our volunteers and tutors with light refreshments.",
  workshop: "Hands-on workshop covering core music theory concepts for all skill levels.",
  summerRecital: "Group recital showcasing summer term repertoire — families welcome.",
  townHall: "National town hall update from the Resonance Foundation board and staff.",
  gala: "Planning draft for the fall fundraiser gala — details TBD before publishing.",
}

const ANNOUNCEMENTS = [
  {
    title: "Fall Registration Now Open",
    body: "Registration for the fall term is now open. Please log in to update your student's enrollment before the term begins.",
    chapterScoped: true,
  },
  {
    title: "New Practice Room Hours",
    body: "Our practice rooms now have extended evening hours Monday through Thursday. See the front desk for booking details.",
    chapterScoped: true,
  },
  {
    title: "Volunteer Appreciation Night Recap",
    body: "Thank you to everyone who joined us for Volunteer Appreciation Night! Photos and highlights are now posted in the chapter gallery.",
    chapterScoped: true,
  },
  {
    title: "Resonance Foundation 2026 Impact Report",
    body: "Our 2026 impact report is here, highlighting the students, tutors, and volunteers making a difference across every chapter this year.",
    chapterScoped: false,
  },
  {
    title: "Updated Code of Conduct for All Chapters",
    body: "We've published an updated code of conduct that applies to all chapters. Please review it in your dashboard resources.",
    chapterScoped: false,
  },
]

const APPLICANTS = [
  {
    slug: "applicant-01",
    fullName: "Miguel Torres",
    type: "tutor",
    instrument: "Trumpet",
    skillLevel: "advanced",
    stage: "applied",
    message: "I've taught brass instruments for 6 years and would love to volunteer as a tutor.",
  },
  {
    slug: "applicant-02",
    fullName: "Hannah Wu",
    type: "tutor",
    instrument: "Piano",
    skillLevel: "advanced",
    stage: "applied",
    message: "Classically trained pianist looking to give back to the community.",
  },
  {
    slug: "applicant-03",
    fullName: "Samuel Green",
    type: "tutor",
    instrument: "Percussion",
    skillLevel: "intermediate",
    stage: "applied",
    message: "Former marching band instructor, available weekday evenings.",
  },
  {
    slug: "applicant-04",
    fullName: "Patricia Lowe",
    type: "volunteer",
    stage: "applied",
    message: "Happy to help with event setup and administrative support.",
  },
  {
    slug: "applicant-05",
    fullName: "Ibrahim Haddad",
    type: "tutor",
    instrument: "Guitar",
    skillLevel: "advanced",
    stage: "interested",
    message: "Reached out at a community event, still deciding on availability.",
  },
  {
    slug: "applicant-06",
    fullName: "Carla Jimenez",
    type: "officer",
    requestedRole: "chapter_officer",
    stage: "applied",
    message: "Longtime parent volunteer interested in taking on an officer role.",
  },
]

const PAYER_POOL = [
  ["Karen Whitmore", "karen.whitmore@example.com"],
  ["Thomas Reed", "thomas.reed@example.com"],
  ["Priscilla Adams", "priscilla.adams@example.com"],
  ["George Malone", "george.malone@example.com"],
  ["Linda Ferreira", "linda.ferreira@example.com"],
  ["Samuel Voss", "samuel.voss@example.com"],
  ["Diane Castillo", "diane.castillo@example.com"],
  ["Robert Yang", "robert.yang@example.com"],
  ["Patricia Ellison", "patricia.ellison@example.com"],
  ["Michael Osborne", "michael.osborne@example.com"],
  ["Carla Jennings", "carla.jennings@example.com"],
  ["Victor Huang", "victor.huang@example.com"],
  ["Whitmore Family Foundation", "giving@whitmorefoundation.example.com"],
  ["Harbor Light Corp Giving", "csr@harborlight.example.com"],
  ["Elaine Brubaker", "elaine.brubaker@example.com"],
]

// ===========================================================================
// SEED main
// ===========================================================================

async function seed() {
  const created = {
    users: 0,
    profiles: 0,
    roles: 0,
    students: 0,
    assignments: 0,
    availability: 0,
    lessons: 0,
    lessonLogs: 0,
    practiceLogs: 0,
    homeworkAssignments: 0,
    events: 0,
    rsvps: 0,
    attendance: 0,
    volunteerHours: 0,
    announcements: 0,
    conversations: 0,
    conversationMembers: 0,
    messages: 0,
    donations: 0,
    applicants: 0,
  }

  const { data: chapters, error: chErr } = await admin
    .from("chapters")
    .select("id, name, status")
    .eq("status", "active")
    .limit(1)
  if (chErr) throw chErr
  const chapter = chapters?.[0]
  if (!chapter) throw new Error("No active chapter found — seed chapters first")
  console.log(`Using chapter: ${chapter.name} (${chapter.id})\n`)

  const existingUsers = await listAllUsers()
  const userMap = new Map(existingUsers.map((u) => [u.email, u]))

  // -------------------------------------------------------------------------
  // Users + profiles + roles
  // -------------------------------------------------------------------------
  console.log("== Users ==")

  const parents = []
  for (let i = 0; i < 12; i++) {
    const idx = String(i + 1).padStart(2, "0")
    const email = `seed-parent-${idx}@resonance.test`
    const fullName = PARENT_NAMES[i]
    const { user, created: wasCreated } = await ensureUser(userMap, {
      email,
      fullName,
      metadata: { signup_type: "parent", chapter_id: chapter.id },
    })
    if (wasCreated) created.users++
    await ensureProfile(user.id, fullName, email)
    const roleResult = await ensureRole(user.id, "student_parent", chapter.id)
    if (roleResult === "created") created.roles++
    parents.push({ id: user.id, email, fullName })
    console.log(`  parent: ${email} (${wasCreated ? "created" : "exists"}), role ${roleResult}`)
  }

  const tutors = []
  for (let i = 0; i < 5; i++) {
    const idx = String(i + 1).padStart(2, "0")
    const email = `seed-tutor-${idx}@resonance.test`
    const fullName = TUTOR_SPECS[i].name
    const { user, created: wasCreated } = await ensureUser(userMap, { email, fullName })
    if (wasCreated) created.users++
    await ensureProfile(user.id, fullName, email)
    const roleResult = await ensureRole(user.id, "tutor", chapter.id)
    if (roleResult === "created") created.roles++
    tutors.push({ id: user.id, email, fullName, instrument: TUTOR_SPECS[i].instrument })
    console.log(`  tutor: ${email} (${wasCreated ? "created" : "exists"}), role ${roleResult}`)
  }

  const volunteers = []
  for (let i = 0; i < 3; i++) {
    const idx = String(i + 1).padStart(2, "0")
    const email = `seed-volunteer-${idx}@resonance.test`
    const fullName = VOLUNTEER_NAMES[i]
    const { user, created: wasCreated } = await ensureUser(userMap, { email, fullName })
    if (wasCreated) created.users++
    await ensureProfile(user.id, fullName, email)
    const roleResult = await ensureRole(user.id, "volunteer", chapter.id)
    if (roleResult === "created") created.roles++
    volunteers.push({ id: user.id, email, fullName })
    console.log(`  volunteer: ${email} (${wasCreated ? "created" : "exists"}), role ${roleResult}`)
  }

  const officerSpec = { email: "seed-officer-01@resonance.test", fullName: "Chris Delgado" }
  const { user: officerUser, created: officerCreated } = await ensureUser(userMap, officerSpec)
  if (officerCreated) created.users++
  await ensureProfile(officerUser.id, officerSpec.fullName, officerSpec.email)
  const officerRole = await ensureRole(officerUser.id, "chapter_officer", chapter.id)
  if (officerRole === "created") created.roles++
  console.log(`  chapter officer: ${officerSpec.email} (${officerCreated ? "created" : "exists"}), role ${officerRole}`)

  const presidentSpec = { email: "seed-president-01@resonance.test", fullName: "Monica Reyes" }
  const { user: presidentUser, created: presidentCreated } = await ensureUser(userMap, presidentSpec)
  if (presidentCreated) created.users++
  await ensureProfile(presidentUser.id, presidentSpec.fullName, presidentSpec.email)
  const presidentRole = await ensureRole(presidentUser.id, "chapter_president", chapter.id)
  if (presidentRole === "created") created.roles++
  console.log(
    `  chapter president: ${presidentSpec.email} (${presidentCreated ? "created" : "exists"}), role ${presidentRole}`
  )

  const corpSpec = { email: "seed-corpofficer-01@resonance.test", fullName: "William Ashford" }
  const { user: corpUser, created: corpCreated } = await ensureUser(userMap, corpSpec)
  if (corpCreated) created.users++
  await ensureProfile(corpUser.id, corpSpec.fullName, corpSpec.email)
  const corpRole = await ensureRole(corpUser.id, "corporate_officer", null)
  if (corpRole === "created") created.roles++
  console.log(`  corporate officer: ${corpSpec.email} (${corpCreated ? "created" : "exists"}), role ${corpRole}`)

  const progAdminSpec = { email: "seed-progadmin-01@resonance.test", fullName: "Dana Whitfield" }
  const { user: progAdminUser, created: progAdminCreated } = await ensureUser(userMap, progAdminSpec)
  if (progAdminCreated) created.users++
  await ensureProfile(progAdminUser.id, progAdminSpec.fullName, progAdminSpec.email)
  const progAdminRole = await ensureRole(progAdminUser.id, "program_administrator", null)
  if (progAdminRole === "created") created.roles++
  console.log(
    `  program administrator: ${progAdminSpec.email} (${progAdminCreated ? "created" : "exists"}), role ${progAdminRole}`
  )

  const allSeedUserIds = [
    ...parents.map((p) => p.id),
    ...tutors.map((t) => t.id),
    ...volunteers.map((v) => v.id),
    officerUser.id,
    presidentUser.id,
    corpUser.id,
    progAdminUser.id,
  ]

  // -------------------------------------------------------------------------
  // Students
  // -------------------------------------------------------------------------
  console.log("\n== Students ==")
  const students = []
  for (const spec of STUDENT_SPECS) {
    const parent = parents[spec.parentIdx]
    const { id, created: wasCreated } = await ensureStudent(parent.id, chapter.id, {
      firstName: spec.firstName,
      lastName: spec.lastName,
      instrument: spec.instrument,
      skillLevel: pick(SKILL_LEVELS),
      status: spec.status,
    })
    if (wasCreated) created.students++
    students.push({ id, parentId: parent.id, status: spec.status, firstName: spec.firstName })
    console.log(`  ${spec.firstName} ${spec.lastName} (${spec.status}) — ${wasCreated ? "created" : "exists"}`)
  }
  const activeStudents = students.filter((s) => s.status === "active")

  // -------------------------------------------------------------------------
  // Tutor availability
  // -------------------------------------------------------------------------
  console.log("\n== Tutor availability ==")
  for (let i = 0; i < tutors.length; i++) {
    const n = await ensureAvailability(tutors[i].id, chapter.id, TUTOR_AVAILABILITY[i])
    created.availability += n
    console.log(`  ${tutors[i].email}: ${n > 0 ? `created ${n} slots` : "already has slots"}`)
  }

  // -------------------------------------------------------------------------
  // student_tutor_assignments + lessons + lesson_logs
  // -------------------------------------------------------------------------
  console.log("\n== Assignments, lessons, lesson logs ==")
  for (let i = 0; i < activeStudents.length; i++) {
    const student = activeStudents[i]
    const tutor = tutors[i % tutors.length]
    const { created: wasCreated } = await ensureAssignment(student.id, tutor.id, chapter.id)
    if (wasCreated) created.assignments++

    const slot = TUTOR_AVAILABILITY[i % tutors.length][0]
    const { createdLessons, createdLogs } = await ensureLessonsForAssignment({
      studentId: student.id,
      tutorId: tutor.id,
      chapterId: chapter.id,
      dow: slot.day,
      startTime: slot.start,
      endTime: slot.end,
    })
    created.lessons += createdLessons
    created.lessonLogs += createdLogs

    const n = await ensureAssignments(student.id, tutor.id)
    created.homeworkAssignments += n

    console.log(
      `  ${student.firstName} <-> ${tutor.fullName}: assignment ${wasCreated ? "created" : "exists"}, ${createdLessons} lessons, ${createdLogs} logs, ${n} homework items`
    )
  }

  // -------------------------------------------------------------------------
  // Practice logs — 10 students
  // -------------------------------------------------------------------------
  console.log("\n== Practice logs ==")
  const practiceStudents = activeStudents.slice(0, 10)
  for (const student of practiceStudents) {
    const n = await ensurePracticeLogs(student.id, student.parentId)
    created.practiceLogs += n
    console.log(`  ${student.firstName}: ${n > 0 ? `${n} entries created` : "already seeded"}`)
  }

  // -------------------------------------------------------------------------
  // Events + RSVPs + attendance
  // -------------------------------------------------------------------------
  console.log("\n== Events ==")
  const now = new Date()
  function daysFromNow(n, hour = 18) {
    const d = new Date(now)
    d.setDate(d.getDate() + n)
    d.setHours(hour, 0, 0, 0)
    return d
  }

  const eventSpecs = [
    {
      title: "Spring Recital Showcase",
      description: EVENT_DESCRIPTIONS.recital,
      location: `${chapter.name} Community Hall`,
      chapterId: chapter.id,
      startsAt: daysFromNow(-60),
      endsAt: daysFromNow(-60, 20),
      status: "published",
      createdBy: presidentUser.id,
    },
    {
      title: "Chapter Volunteer Appreciation Night",
      description: EVENT_DESCRIPTIONS.volunteer,
      location: `${chapter.name} Community Hall`,
      chapterId: chapter.id,
      startsAt: daysFromNow(-35),
      endsAt: daysFromNow(-35, 20),
      status: "published",
      createdBy: officerUser.id,
    },
    {
      title: "Music Theory Workshop",
      description: EVENT_DESCRIPTIONS.workshop,
      location: `${chapter.name} Practice Studio`,
      chapterId: chapter.id,
      startsAt: daysFromNow(-10),
      endsAt: daysFromNow(-10, 20),
      status: "published",
      createdBy: officerUser.id,
    },
    {
      title: "Summer Group Recital",
      description: EVENT_DESCRIPTIONS.summerRecital,
      location: `${chapter.name} Community Hall`,
      chapterId: chapter.id,
      startsAt: daysFromNow(7),
      endsAt: daysFromNow(7, 20),
      status: "published",
      capacity: 15,
      createdBy: presidentUser.id,
    },
    {
      title: "Resonance Foundation National Town Hall",
      description: EVENT_DESCRIPTIONS.townHall,
      location: "Virtual (link shared via email)",
      chapterId: null,
      startsAt: daysFromNow(12),
      endsAt: daysFromNow(12, 20),
      status: "published",
      createdBy: progAdminUser.id,
    },
    {
      title: "Fall Fundraiser Gala (Planning)",
      description: EVENT_DESCRIPTIONS.gala,
      location: "TBD",
      chapterId: chapter.id,
      startsAt: daysFromNow(40),
      endsAt: daysFromNow(40, 22),
      status: "draft",
      createdBy: presidentUser.id,
    },
  ]

  const attendeePool = [
    ...parents.map((p) => p.id),
    ...tutors.map((t) => t.id),
    ...volunteers.map((v) => v.id),
    officerUser.id,
  ]

  const events = []
  for (const spec of eventSpecs) {
    const { id, created: wasCreated } = await ensureEvent(spec)
    if (wasCreated) created.events++
    events.push({ id, status: spec.status, capacity: spec.capacity ?? null, title: spec.title })
    console.log(`  ${spec.title}: ${wasCreated ? "created" : "exists"}`)
  }

  console.log("\n== RSVPs + attendance ==")
  for (const event of events) {
    if (event.status !== "published") continue

    // Idempotency: top up to a target instead of resampling every run —
    // otherwise reruns keep adding new distinct users from the pool each
    // time (converging on the whole pool), which for the capacity=15 event
    // would eventually trip the enforce_event_capacity trigger.
    const { data: existingGoingRows, error: goingErr } = await admin
      .from("event_rsvps")
      .select("user_id")
      .eq("event_id", event.id)
      .eq("status", "going")
    if (goingErr) throw goingErr
    const goingUserIds = (existingGoingRows ?? []).map((r) => r.user_id)

    if (goingUserIds.length < 5) {
      const maxTarget = event.capacity ? Math.min(12, event.capacity) : 12
      const target = rand(5, maxTarget)
      const need = target - goingUserIds.length
      const candidates = shuffle(attendeePool.filter((id) => !goingUserIds.includes(id))).slice(0, need)
      for (const userId of candidates) {
        const rsvpCreated = await ensureRsvp(event.id, userId, "going")
        if (rsvpCreated) created.rsvps++
        goingUserIds.push(userId)
      }
    }
    console.log(`  ${event.title}: ${goingUserIds.length} 'going' RSVPs (total)`)

    const isPast = eventSpecs.find((e) => e.title === event.title)?.startsAt < now
    if (isPast) {
      const { data: existingAttRows, error: attErr } = await admin
        .from("event_attendance")
        .select("user_id")
        .eq("event_id", event.id)
      if (attErr) throw attErr
      const checkedInUserIds = (existingAttRows ?? []).map((r) => r.user_id)
      const targetCheckedIn = Math.round(goingUserIds.length * 0.8)
      if (checkedInUserIds.length < targetCheckedIn) {
        const need = targetCheckedIn - checkedInUserIds.length
        const candidates = shuffle(goingUserIds.filter((id) => !checkedInUserIds.includes(id))).slice(0, need)
        for (const userId of candidates) {
          const attCreated = await ensureAttendance(event.id, userId, officerUser.id)
          if (attCreated) created.attendance++
          checkedInUserIds.push(userId)
        }
      }
      console.log(`    checked in: ${checkedInUserIds.length} (total)`)
    }
  }

  // -------------------------------------------------------------------------
  // Volunteer hours
  // -------------------------------------------------------------------------
  console.log("\n== Volunteer hours ==")
  const vhStatusPool = shuffle([
    ...Array(30).fill("approved"),
    ...Array(8).fill("pending"),
    ...Array(2).fill("rejected"),
  ])
  const vhUsers = [...volunteers.map((v) => ({ id: v.id, email: v.email })), ...tutors.map((t) => ({ id: t.id, email: t.email }))]
  for (const u of vhUsers) {
    const n = await ensureVolunteerHoursForUser(u.id, chapter.id, 5, vhStatusPool, presidentUser.id)
    created.volunteerHours += n
    console.log(`  ${u.email}: ${n > 0 ? `${n} rows created` : "already seeded"}`)
  }

  // -------------------------------------------------------------------------
  // Announcements
  // -------------------------------------------------------------------------
  console.log("\n== Announcements ==")
  for (let i = 0; i < ANNOUNCEMENTS.length; i++) {
    const spec = ANNOUNCEMENTS[i]
    const publishedAt = new Date(now)
    publishedAt.setDate(publishedAt.getDate() - (28 - i * 7))
    const createdBy = i % 2 === 0 ? presidentUser.id : progAdminUser.id
    const wasCreated = await ensureAnnouncement({
      title: spec.title,
      body: spec.body,
      chapterId: spec.chapterScoped ? chapter.id : null,
      publishedAt,
      createdBy,
    })
    if (wasCreated) created.announcements++
    console.log(`  ${spec.title}: ${wasCreated ? "created" : "exists"}`)
  }

  // -------------------------------------------------------------------------
  // Conversations + messages (8 tutor-student pairs)
  // -------------------------------------------------------------------------
  console.log("\n== Conversations + messages ==")
  const conversationPairs = activeStudents.slice(0, 8).map((student, i) => ({
    student,
    tutor: tutors[i % tutors.length],
  }))
  for (const { student, tutor } of conversationPairs) {
    const conversationId = await ensureConversation(student.id, tutor.id, chapter.id)
    const memberTutor = await ensureConversationMember(conversationId, tutor.id)
    const memberParent = await ensureConversationMember(conversationId, student.parentId)
    if (memberTutor) created.conversationMembers++
    if (memberParent) created.conversationMembers++
    created.conversations++ // counted as "touched"; exact new-vs-existing tracked via message count below
    const n = await ensureMessages(conversationId, tutor.id, student.parentId)
    created.messages += n
    console.log(`  ${student.firstName} <-> ${tutor.fullName}: ${n > 0 ? `${n} messages created` : "already seeded"}`)
  }

  // -------------------------------------------------------------------------
  // Donations
  // -------------------------------------------------------------------------
  console.log("\n== Donations ==")
  const monthCounts = new Array(12).fill(2)
  for (let i = 0; i < 6; i++) monthCounts[i] += 1 // 30 total (6*3 + 6*2)
  let donationIndex = 0
  for (let monthsAgo = 0; monthsAgo < 12; monthsAgo++) {
    for (let j = 0; j < monthCounts[monthsAgo]; j++) {
      donationIndex++
      const [payerName, payerEmail] = pick(PAYER_POOL)
      const amount = rand(10, 500)
      const source = Math.random() < 0.55 ? "paypal_webhook" : "manual"
      const donatedAt = dateInMonthsAgo(monthsAgo)
      let feeAmount = null
      let netAmount = null
      if (source === "paypal_webhook") {
        feeAmount = Math.round((amount * 0.029 + 0.3) * 100) / 100
        netAmount = Math.round((amount - feeAmount) * 100) / 100
      }
      const wasCreated = await ensureDonation(donationIndex, {
        chapterId: Math.random() < 0.7 ? chapter.id : null,
        amount,
        source,
        payerName,
        payerEmail,
        donatedAt,
        recordedBy: source === "manual" ? progAdminUser.id : null,
        feeAmount,
        netAmount,
      })
      if (wasCreated) created.donations++
    }
  }
  console.log(`  ${created.donations} new donation rows created (target 30 total)`)

  // -------------------------------------------------------------------------
  // Applicants
  // -------------------------------------------------------------------------
  console.log("\n== Applicants ==")
  for (const a of APPLICANTS) {
    const email = `seed-${a.slug}@resonance.test`
    const wasCreated = await ensureApplicant({
      email,
      fullName: a.fullName,
      type: a.type,
      chapterId: chapter.id,
      instrument: a.instrument ?? null,
      skillLevel: a.skillLevel ?? null,
      stage: a.stage,
      requestedRole: a.requestedRole ?? null,
      message: a.message,
    })
    if (wasCreated) created.applicants++
    console.log(`  ${email} (${a.type}, ${a.stage}): ${wasCreated ? "created" : "exists"}`)
  }

  // -------------------------------------------------------------------------
  // Verification counts
  // -------------------------------------------------------------------------
  console.log("\n== Verification (current totals matching seeded data) ==")
  const parentIds = parents.map((p) => p.id)
  const tutorIds = tutors.map((t) => t.id)
  const studentIds = students.map((s) => s.id)

  const { data: seedLessons, error: seedLessonsErr } = await admin
    .from("lessons")
    .select("id")
    .in("student_id", studentIds)
  if (seedLessonsErr) throw seedLessonsErr
  const seedLessonIds = (seedLessons ?? []).map((l) => l.id)

  const counts = {
    users: allSeedUserIds.length,
    profiles: await countWhere("profiles", "id", allSeedUserIds),
    user_roles: await countWhere("user_roles", "user_id", allSeedUserIds),
    students: await countWhere("students", "parent_user_id", parentIds),
    student_tutor_assignments: await countWhere("student_tutor_assignments", "student_id", studentIds),
    tutor_availability: await countWhere("tutor_availability", "tutor_user_id", tutorIds),
    lessons: seedLessonIds.length,
    lesson_logs: await countWhere("lesson_logs", "lesson_id", seedLessonIds),
    practice_logs: await countWhere("practice_logs", "student_id", studentIds),
    assignments: await countWhere("assignments", "student_id", studentIds),
    events: await countWhere("events", "created_by", allSeedUserIds),
    event_rsvps: await countWhere("event_rsvps", "user_id", allSeedUserIds),
    event_attendance: await countWhere("event_attendance", "user_id", allSeedUserIds),
    volunteer_hours: await countWhere("volunteer_hours", "user_id", allSeedUserIds),
    announcements: await countWhere("announcements", "created_by", allSeedUserIds),
    conversations: await countWhere("conversations", "tutor_user_id", tutorIds),
    conversation_members: await countWhere("conversation_members", "user_id", allSeedUserIds),
    messages: await countWhere("messages", "sender_id", allSeedUserIds),
  }
  const { count: donationCount } = await admin
    .from("donations")
    .select("id", { count: "exact", head: true })
    .eq("notes", "SEED")
  counts.donations = donationCount ?? 0
  const { data: seedApplicants } = await admin.from("applicants").select("id, email")
  counts.applicants = (seedApplicants ?? []).filter((a) => isSeedEmail(a.email)).length

  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table}: ${count}`)
  }

  console.log("\nDone. Password for all seed users:", PASSWORD)
  console.log("Rerun:  node scripts/dev/seed-demo-data.mjs")
  console.log("Wipe:   node scripts/dev/seed-demo-data.mjs --wipe")

  return counts
}

// ===========================================================================
// entry point
// ===========================================================================

if (WIPE) {
  await wipe()
} else {
  await seed()
}
