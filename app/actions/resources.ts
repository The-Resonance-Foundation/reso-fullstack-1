"use server"

import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { canManageLessons, verifySession } from "@/lib/auth/dal"
import { revalidateTutorStudentPaths } from "@/lib/portal/revalidate-tutor"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerClientOrThrow } from "@/lib/supabase/server"
import {
  resourceSchema,
  type ResourceFormState,
} from "@/lib/validations/phase23"

// Mirrors the 'resources' storage bucket config (supabase/migrations/
// 20260710000001_portal_hardening.sql) — keep these two in lockstep.
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "video/mp4",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
])

// The resourceSchema/resource_storage_type enum has no dedicated "upload"
// value — uploaded files reuse the existing "supabase" storage type. The UI
// presents this option to users as "Upload file".
const UPLOAD_STORAGE_TYPE = "supabase" as const

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

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

  const isUpload = validated.data.storageType === UPLOAD_STORAGE_TYPE

  if (
    (validated.data.storageType === "link" || validated.data.storageType === "drive") &&
    !validated.data.url
  ) {
    return { message: "URL is required for link and drive resources." }
  }

  let file: File | null = null
  if (isUpload) {
    const rawFile = formData.get("file")
    if (!(rawFile instanceof File) || rawFile.size === 0) {
      return { message: "Choose a file to upload." }
    }
    if (rawFile.size > MAX_UPLOAD_BYTES) {
      return { message: "That file is too large — the limit is 20MB." }
    }
    if (!ALLOWED_UPLOAD_MIME_TYPES.has(rawFile.type)) {
      return {
        message:
          "That file type isn't supported. Upload a PDF, image, audio/video clip, text file, or Office document.",
      }
    }
    file = rawFile
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

  let storagePath: string | null = null
  const admin = isUpload ? createAdminClient() : null

  if (isUpload && file && admin) {
    storagePath = `${validated.data.chapterId}/${randomUUID()}-${sanitizeFileName(file.name)}`
    const { error: uploadError } = await admin.storage
      .from("resources")
      .upload(storagePath, file, { contentType: file.type })

    if (uploadError) {
      return { message: `Upload failed: ${uploadError.message}` }
    }
  }

  const { error } = await supabase.from("resources").insert({
    chapter_id: validated.data.chapterId,
    student_id: validated.data.studentId || null,
    uploaded_by: user.id,
    title: validated.data.title,
    description: validated.data.description ?? null,
    storage_type: validated.data.storageType,
    url: isUpload ? null : validated.data.url ?? null,
    storage_path: storagePath,
  })

  if (error) {
    if (storagePath && admin) {
      // Best-effort cleanup — the row insert failed, don't leave an orphaned
      // object in the bucket. Non-fatal if this also fails.
      const { error: removeError } = await admin.storage.from("resources").remove([storagePath])
      if (removeError) {
        console.error("addResource: failed to remove orphaned upload", removeError.message)
      }
    }
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
    .select("chapter_id, storage_path")
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

  if (resource.storage_path) {
    // Best-effort — the row is already gone either way, just don't leave the
    // file behind in storage.
    const admin = createAdminClient()
    const { error: removeError } = await admin.storage
      .from("resources")
      .remove([resource.storage_path])
    if (removeError) {
      console.error("deleteResource: failed to remove storage object", removeError.message)
    }
  }

  revalidatePath("/dashboard/resources")
  revalidatePath("/dashboard/admin/docs")
  return { success: true, message: "Resource removed." }
}
