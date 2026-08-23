// Signs in a test user via @supabase/ssr (same client the app uses) and
// prints the auth cookies in "name=value; name=value" form for curl.
// Usage: node login-cookie.mjs <email> [password]
// When auth CAPTCHA is enabled (blocks the password grant), falls back to an
// admin-generated magic link verified via verifyOtp, which is not gated.
import { createServerClient } from "@supabase/ssr"
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
const email = process.argv[2]
const password = process.argv[3] ?? "TestPortal!2026"
if (!email) {
  console.error("usage: node login-cookie.mjs <email> [password]")
  process.exit(1)
}

const jar = new Map()
const supabase = createServerClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        for (const { name, value } of cookies) jar.set(name, value)
      },
    },
  }
)

const { error } = await supabase.auth.signInWithPassword({ email, password })
if (error) {
  if (/captcha/i.test(error.message)) {
    const admin = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    })
    if (linkErr) {
      console.error("magiclink fallback failed:", linkErr.message)
      process.exit(1)
    }
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: link.properties.hashed_token,
    })
    if (verifyErr) {
      console.error("magiclink verify failed:", verifyErr.message)
      process.exit(1)
    }
  } else {
    console.error("login failed:", error.message)
    process.exit(1)
  }
}

console.log(
  [...jar.entries()].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join("; ")
)
