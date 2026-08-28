import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { siteConfig } from "@/lib/config/site"

const protectedPrefixes = ["/dashboard"]
const authRoutes = ["/login", "/signup", "/enroll/parent", "/join"]

export async function proxy(request: NextRequest) {
  if (!siteConfig.features.authEnabled) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Local ES256 verification against the cached JWKS: no auth-server round
  // trip on every request. getClaims still refreshes an expired session (and
  // the refreshed cookies ride out on the response), and this only gates
  // redirects — pages re-verify through the DAL, and RLS guards the data.
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
  let user: { id: string } | null = claimsData?.claims?.sub
    ? { id: claimsData.claims.sub }
    : null
  if (claimsError) {
    const { data } = await supabase.auth.getUser()
    user = data.user ? { id: data.user.id } : null
  }

  const { pathname } = request.nextUrl
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  )
  const isAuthRoute = authRoutes.includes(pathname)

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && user) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = "/dashboard"
    return NextResponse.redirect(dashboardUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/enroll/parent",
    "/join",
  ],
}
