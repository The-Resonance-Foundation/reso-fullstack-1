# Supabase migrations

Phase 1 SQL lives in `supabase/migrations/`. Apply to your hosted project before running the app with auth/forms enabled.

## Option A — Script (recommended)

1. In Supabase Dashboard → **Project Settings → Database**, copy the **Connection string** (URI mode, pooler or direct).
2. Add to `.env.local`:
   ```
   SUPABASE_DB_URL=postgresql://postgres.[ref]:[PASSWORD]@...
   ```
3. Run:
   ```bash
   npm run db:migrate
   ```

The script tracks applied files in `schema_migrations` and skips migrations already run.

## Option B — SQL Editor

Paste and run each file in order in the Supabase **SQL Editor**:

1. `20250622000001_phase1_schema.sql`
2. `20250622000002_phase1_rls.sql`
3. `20250622000003_seed_chapters.sql`
4. `20250622000004_applicant_rejected_stage.sql`
5. `20250622000005_phase1_enrollment_fields.sql`
6. `20250622000006_schema_migrations.sql`
7. `20250622000007_workflow_redesign.sql`
8. `20250622000008_workflow_redesign_rls.sql`

## Enrollment workflows (migration 007+)

**Parents:** `/enroll` (marketing) → `/enroll/parent` signup → confirm email → add students in portal (`students.status = pending`) → officers accept/reject on `/dashboard/admin/families`.

**Staff (tutor / officer / volunteer):** `/join` signup → guest dashboard applications → officers accept/reject on `/dashboard/applicants` (grants `user_roles` directly, no invite).

Legacy `applicants.type = student` rows are ignored by the new UI.

Under **Authentication → URL Configuration**, add:

- `http://localhost:3000/auth/confirm`
- `http://localhost:3000/auth/callback`
- `https://theresonancefoundation.org/auth/confirm`
- `https://theresonancefoundation.org/auth/callback`

For local dev, set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local` so invite emails open on your machine.

Invite flow: email link → `/auth/confirm` → `/set-password` → dashboard (applicant becomes `active` on first login).

## Auth settings (recommended for dev)

With **Confirm email** enabled, signup confirmation is sent via **Resend** (`RESEND_API_KEY` in `.env.local`). You do not need Supabase custom SMTP for signup — but you can still add it as a backup.

1. Create an API key at [resend.com](https://resend.com) and add `RESEND_API_KEY` to `.env.local`.
2. Verify your sending domain in Resend (or use `onboarding@resend.dev` for testing to your own address only).
3. Set `RESEND_FROM_EMAIL` to a verified sender, e.g. `The Resonance Foundation <noreply@yourdomain.com>`.

Signup and resend use `emailRedirectTo` → `/auth/confirm?next=/dashboard`. Ensure these URLs are in **Authentication → URL Configuration → Redirect URLs**:

- `http://localhost:3000/auth/confirm`
- `http://localhost:3000/auth/callback`
- `https://theresonancefoundation.org/auth/confirm`
- `https://theresonancefoundation.org/auth/callback`

Optional: configure Supabase custom SMTP as a second path for auth emails.

## Bootstrap first admin

After migrations, promote your account in SQL Editor (replace emails/ids):

```sql
-- Example: grant board role to your user after first signup
INSERT INTO public.user_roles (user_id, chapter_id, role, status)
SELECT id, NULL, 'board_of_director', 'active'
FROM auth.users
WHERE email = 'you@example.com'
ON CONFLICT DO NOTHING;
```

Board members can then use **Dashboard → Chapters** and **Role assignments** in the portal.
