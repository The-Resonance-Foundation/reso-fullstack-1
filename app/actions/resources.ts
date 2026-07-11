"use server"

import { revalidatePath } from "next/cache"
import { canManageLessons, verifySession } from "@/lib/auth/dal"
import { revalidateTutorStudentPaths } from "@/lib/portal/revalidate-tutor"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import {
  resourceSchema,
  type ResourceFormState,
} from "@/lib/validations/phase23"

export async function addResource(
  _prev: ResourceFormState,
  formData: FormData
): Promise<ResourceFormState> {
  const validated = resourceSchema.safeParse({
    chapterId: formData.get("chapterId"),
    studentId: formData.get("studentId") || undefined,
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    storageType: formData.get("storageType"),
    url: formData.get("url") || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  if (
    (validated.data.storageType === "link" || validated.data.storageType === "drive") &&
    !validated.data.url
  ) {
    return { message: "URL is required for link and drive resources." }
  }

  const user = await verifySession()
  // canManageLessons is chapter-scoped for tutors too — no global fallback,
  // so a tutor in chapter A can no longer post resources into chapter B.
  const allowed = await canManageLessons(validated.data.chapterId)
  if (!allowed) {
    return { message: "You are not authorized to add resources for this chapter." }
  }

  const supabase = await getServerClientOrThrow()

  if (validated.data.studentId) {
    // RLS scopes visibility: tutors can only see assigned students, officers
    // their chapter's. The student must also live in the target chapter.
    const { data: student } = await supabase
      .from("students")
      .select("id, chapter_id")
      .eq("id", validated.data.studentId)
      .maybeSingle()

    if (!student || student.chapter_id !== validated.data.chapterId) {
      return { message: "You can only attach resources to students you work with." }
    }
  }

  const { error } = await supabase.from("resources").insert({
    chapter_id: validated.data.chapterId,
    student_id: validated.data.studentId || null,
    uploaded_by: user.id,
    title: validated.data.title,
    description: validated.data.description ?? null,
    storage_type: validated.data.storageType,
    url: validated.data.url ?? null,
    storage_path: null,
  })

  if (error) {
    return { message: error.message }
  }

  revalidatePath("/dashboard/resources")
  revalidatePath("/dashboard/admin/docs")
  if (validated.data.studentId) {
    revalidateTutorStudentPaths(validated.data.studentId)
  }
  return { success: true, message: "Resource added." }
}

export async function deleteResource(
  _prev: ResourceFormState,
  formData: FormData
): Promise<ResourceFormState> {
  const id = String(formData.get("id") ?? "")
  if (!id) return { message: "Missing resource id." }

  await verifySession()
  const supabase = await getServerClientOrThrow()

  const { data: resource } = await supabase
    .from("resources")
    .select("chapter_id")
    .eq("id", id)
    .maybeSingle()

  if (!resource) {
    return { message: "Resource not found." }
  }

  const allowed = await canManageLessons(resource.chapter_id)
  if (!allowed) {
    return { message: "You are not authorized to delete this resource." }
  }

  const { error } = await supabase.from("resources").delete().eq("id", id)
  if (error) {
    return { message: error.message }
  }

  revalidatePath("/dashboard/resources")
  revalidatePath("/dashboard/admin/docs")
  return { success: true, message: "Resource removed." }
}
