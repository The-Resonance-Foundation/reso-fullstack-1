// Signs in a test user via @supabase/ssr (same client the app uses) and
// prints the auth cookies in "name=value; name=value" form for curl.
// Usage: node login-cookie.mjs <email> [password]
import { createServerClient } from "@supabase/ssr"
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
  console.error("login failed:", error.message)
  process.exit(1)
}

console.log(
  [...jar.entries()].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join("; ")
)
