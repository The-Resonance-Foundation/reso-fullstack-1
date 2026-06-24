/** Pure helpers for signup flows (testable without Supabase). */

export function isDuplicateSignup(user: { identities?: unknown[] | null } | null) {
  return Boolean(user?.identities && user.identities.length === 0)
}

export function parentMayEnrollInChapter(
  chapterId: string,
  parentChapterIds: (string | null)[]
) {
  return parentChapterIds.filter(Boolean).includes(chapterId)
}
