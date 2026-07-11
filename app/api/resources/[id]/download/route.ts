import { redirect } from "next/navigation"
import { NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/dal"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerClientOrThrow } from "@/lib/supabase/server"

const SIGNED_URL_TTL_SECONDS = 60

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  await verifySession()

  // User-scoped client — RLS decides whether this resource row is visible to
  // the caller at all. Not visible (or doesn't exist) reads as 404 either way.
  const supabase = await getServerClientOrThrow()
  const { data: resource } = await supabase
    .from("resources")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle()

  if (!resource?.storage_path) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 })
  }

  // Signing the URL requires the service-role client — the 'resources' bucket
  // has no public read policy, only the RLS-gated SELECT check above.
  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from("resources")
    .createSignedUrl(resource.storage_path, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "File not found." }, { status: 404 })
  }

  redirect(data.signedUrl)
}
