import { NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/dal"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerClientOrThrow } from "@/lib/supabase/server"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  await verifySession()
  const supabase = await getServerClientOrThrow()

  const { data: certificate } = await supabase
    .from("certificates")
    .select("storage_path, title")
    .eq("id", id)
    .maybeSingle()

  if (!certificate?.storage_path) {
    return NextResponse.json({ error: "Certificate not found." }, { status: 404 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from("certificates")
    .download(certificate.storage_path)

  if (error || !data) {
    return NextResponse.json({ error: "File not found." }, { status: 404 })
  }

  const buffer = Buffer.from(await data.arrayBuffer())
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${certificate.title.replace(/\s+/g, "-")}.pdf"`,
    },
  })
}
