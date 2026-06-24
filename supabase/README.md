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
9. `20250622000009_students_insert_parent_chapter.sql`
10. `20250622000010_phase2_schema.sql` — lessons, practice, assignments, resources, tutor assignments
11. `20250622000011_phase2_rls.sql`
12. `20250622000012_phase3_schema.sql` — events, RSVPs, attendance
13. `20250622000013_phase3_rls.sql`
14. `20250622000014_phase4_schema.sql` — volunteer hours, certificates, storage bucket
15. `20250622000015_phase4_rls.sql`
16. `20250622000016_phase5_schema.sql` — conversations, messages, announcements, notifications, Realtime
17. `20250622000017_phase5_rls.sql`
18. `20250622000018_phase6_schema.sql` — donations, audit_logs, PayPal webhook staging
19. `20250622000019_phase6_rls.sql`

**Do not use** `supabase/apply_all.sql` — it only concatenates migrations 001–003 and is stale. Always use `npm run db:migrate` or run files 001–019 individually.

## Phase 6 admin features (migrations 018+)

After migrations 018–019, the portal also includes:

- **Donations** — PayPal webhook auto-logging at `/api/webhooks/paypal`, admin list at `/dashboard/admin/donations`
- **Manual donations** — board and corporate officers can record offline gifts
- **Audit logs** — append-only trail at `/dashboard/admin/audit-logs` (board + program administrator)

### PayPal webhook env vars

Add to `.env.local` (and Vercel project settings):

```
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
```

For local signature testing without PayPal credentials, set `PAYPAL_SKIP_VERIFY=true` (development only).

Register webhook URL: `https://<your-domain>/api/webhooks/paypal` with events:
`PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.REFUNDED`, `PAYMENT.CAPTURE.REVERSED`.

Parse smoke test: `node scripts/test-paypal-webhook-parse.mjs`
RLS policy check: `node scripts/check-phase6-rls.mjs`

## Phase 4 & 5 portal features (migrations 014+)

After migrations 014–017, the portal also includes:

- **Volunteer hours** — tutors and volunteers log hours; officers approve; certificates + PDF download
- **Messages** — tutor–student threads (parent always included); Realtime delivery; soft-delete only
- **Message audit** — read-only for chapter president, program administrator, and board (not chapter officers)
- **Announcements** — chapter or org-wide; in-app notification fan-out
- **Notifications** — bell in portal header with unread count

Backfill existing tutor assignments to conversations:

```bash
node scripts/backfill-conversations.mjs
```

After migrations 010–013, the portal includes:

- **Lessons** — tutor scheduling, lesson logs, officer tutor assignments
- **Practice** — parent practice logging with progress chart
- **Assignments** — tutor homework, parent submission
- **Resources** — chapter/student materials (link/drive)
- **Calendar** — combined lessons + events view
- **Events** — RSVP with capacity guard, officer attendance check-in

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
