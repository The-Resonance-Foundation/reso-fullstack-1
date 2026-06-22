/**
 * Apply local SQL migrations to a hosted Supabase Postgres database.
 *
 * Requires SUPABASE_DB_URL in .env.local, e.g.:
 * postgresql://postgres.[ref]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
 *
 * Usage: node scripts/apply-migrations.mjs
 */
import { readFileSync, readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const migrationsDir = join(root, "supabase", "migrations")

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8")
    for (const line of raw.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq === -1) continue
      const key = trimmed.slice(0, eq)
      const value = trimmed.slice(eq + 1)
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // .env.local optional if vars already exported
  }
}

loadEnvLocal()

const connectionString = process.env.SUPABASE_DB_URL
if (!connectionString) {
  console.error(
    "Missing SUPABASE_DB_URL. Add your Supabase database connection string to .env.local"
  )
  process.exit(1)
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  console.log(`Connected. Applying ${files.length} migration(s)...`)

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `)

  const { rows: existingTypes } = await client.query(
    "SELECT 1 FROM pg_type WHERE typname = 'app_role' LIMIT 1"
  )
  if (existingTypes.length > 0) {
    const legacyFiles = files.filter((f) =>
      [
        "20250622000001_phase1_schema.sql",
        "20250622000002_phase1_rls.sql",
        "20250622000003_seed_chapters.sql",
        "20250622000004_applicant_rejected_stage.sql",
      ].includes(f)
    )
    for (const file of legacyFiles) {
      await client.query(
        "INSERT INTO public.schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
        [file]
      )
    }
  }

  for (const file of files) {
    const { rows: applied } = await client.query(
      "SELECT 1 FROM public.schema_migrations WHERE filename = $1",
      [file]
    )
    if (applied.length > 0) {
      console.log(`  skip ${file} (already applied)`)
      continue
    }

    const sql = readFileSync(join(migrationsDir, file), "utf8")
    console.log(`  -> ${file}`)
    await client.query("BEGIN")
    try {
      await client.query(sql)
      await client.query(
        "INSERT INTO public.schema_migrations (filename) VALUES ($1)",
        [file]
      )
      await client.query("COMMIT")
    } catch (err) {
      await client.query("ROLLBACK")
      throw err
    }
  }

  const { rows } = await client.query(
    "SELECT id, name, slug FROM public.chapters ORDER BY name"
  )
  console.log("Chapters:", rows)
  console.log("Migrations applied successfully.")
} catch (err) {
  console.error("Migration failed:", err.message)
  process.exit(1)
} finally {
  await client.end()
}
