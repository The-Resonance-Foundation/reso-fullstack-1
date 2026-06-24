import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

export async function ensureTutorStudentConversation({
  studentId,
  tutorUserId,
  chapterId,
}: {
  studentId: string
  tutorUserId: string
  chapterId: string
}) {
  const admin = createAdminClient()

  const { data: student } = await admin
    .from("students")
    .select("parent_user_id")
    .eq("id", studentId)
    .maybeSingle()

  if (!student?.parent_user_id) {
    return { error: "Student or parent not found." }
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

    if (error || !created) {
      return { error: error?.message ?? "Could not create conversation." }
    }
    conversationId = created.id
  }

  const memberIds = [student.parent_user_id, tutorUserId]
  for (const userId of memberIds) {
    await admin.from("conversation_members").upsert(
      { conversation_id: conversationId, user_id: userId },
      { onConflict: "conversation_id,user_id", ignoreDuplicates: true }
    )
  }

  return { conversationId }
}

export async function backfillTutorStudentConversations() {
  const admin = createAdminClient()
  const { data: assignments } = await admin
    .from("student_tutor_assignments")
    .select("student_id, tutor_user_id, chapter_id")
    .eq("status", "active")

  for (const row of assignments ?? []) {
    if (!row.tutor_user_id) continue
    await ensureTutorStudentConversation({
      studentId: row.student_id,
      tutorUserId: row.tutor_user_id,
      chapterId: row.chapter_id,
    })
  }
}
