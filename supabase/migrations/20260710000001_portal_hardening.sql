-- Portal hardening wave (2026-07-10)
-- 1. profiles.email (kills per-user auth-admin N+1 lookups on admin pages)
-- 2. Missing indexes for common query patterns
-- 3. RLS tightening: clients can no longer self-approve/self-activate by
--    setting workflow status columns directly
-- 4. Race safety: event RSVP capacity + tutor availability overlaps
-- 5. updated_at coverage for mutable tables
-- 6. SQL aggregates/preview RPCs (donation totals, conversation previews)
-- 7. Private storage bucket for lesson/chapter resources

-- ---------------------------------------------------------------------------
-- 1. profiles.email
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id
  AND p.email IS DISTINCT FROM u.email;

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

-- Keep profiles.email in sync when a user's auth email changes.
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_profile_email();

-- handle_new_user: also store email, and only grant the parent role when the
-- client-supplied chapter actually exists and is active (metadata is
-- untrusted input).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_chapter_id uuid;
  v_signup_type text;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );
  v_chapter_id := NULLIF(NEW.raw_user_meta_data ->> 'chapter_id', '')::uuid;
  v_signup_type := COALESCE(NEW.raw_user_meta_data ->> 'signup_type', '');

  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    NEW.id,
    v_full_name,
    NEW.raw_user_meta_data ->> 'phone',
    NEW.email
  );

  IF v_signup_type = 'parent'
     AND v_chapter_id IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.chapters c
       WHERE c.id = v_chapter_id AND c.status = 'active'
     )
  THEN
    INSERT INTO public.user_roles (user_id, chapter_id, role, status)
    VALUES (NEW.id, v_chapter_id, 'student_parent', 'active');
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Missing indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS applicants_converted_user_idx
  ON public.applicants (converted_user_id);

CREATE INDEX IF NOT EXISTS user_roles_role_status_idx
  ON public.user_roles (role, status);

CREATE INDEX IF NOT EXISTS guardian_consents_student_idx
  ON public.guardian_consents (student_id);

CREATE INDEX IF NOT EXISTS event_rsvps_user_idx
  ON public.event_rsvps (user_id);

CREATE INDEX IF NOT EXISTS event_attendance_user_idx
  ON public.event_attendance (user_id);

-- ---------------------------------------------------------------------------
-- 3. RLS tightening: workflow status columns
-- ---------------------------------------------------------------------------

-- Volunteers/tutors could insert hours with status='approved', bypassing
-- review entirely. New hours must start pending.
DROP POLICY IF EXISTS volunteer_hours_insert ON public.volunteer_hours;
CREATE POLICY volunteer_hours_insert
  ON public.volunteer_hours
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND public.is_volunteer_or_tutor_in_chapter(auth.uid(), chapter_id)
  );

-- Parents could insert students with status='active', bypassing enrollment
-- review. Parent-created students must start pending.
DROP POLICY IF EXISTS students_insert_parent ON public.students;
CREATE POLICY students_insert_parent
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      parent_user_id = auth.uid()
      AND status = 'pending'
      AND EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'student_parent'
          AND ur.status = 'active'
          AND ur.chapter_id = chapter_id
      )
    )
    OR public.is_board(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  );

-- Parents may edit their student's info but only reviewers may change status
-- (an UPDATE-policy WITH CHECK cannot compare OLD/NEW, so use a trigger).
CREATE OR REPLACE FUNCTION public.guard_student_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND auth.uid() IS NOT NULL
     AND NOT (
       public.is_board(auth.uid())
       OR public.can_manage_chapter(auth.uid(), OLD.chapter_id)
     )
  THEN
    RAISE EXCEPTION 'Only chapter managers can change student status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS students_status_guard ON public.students;
CREATE TRIGGER students_status_guard
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_student_status_change();

-- Tutors could create lessons already marked completed. Tutor-created
-- lessons must start scheduled; chapter managers/board keep full control.
DROP POLICY IF EXISTS lessons_insert ON public.lessons;
CREATE POLICY lessons_insert
  ON public.lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      tutor_user_id = auth.uid()
      AND status = 'scheduled'
      AND public.is_assigned_tutor(auth.uid(), student_id)
    )
    OR public.is_board(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  );

-- ---------------------------------------------------------------------------
-- 4. Race safety
-- ---------------------------------------------------------------------------

-- Serialize capacity checks per event so concurrent RSVPs cannot exceed
-- capacity (COUNT + INSERT was racy).
CREATE OR REPLACE FUNCTION public.enforce_event_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capacity integer;
  v_going_count integer;
BEGIN
  IF NEW.status <> 'going' THEN
    RETURN NEW;
  END IF;

  SELECT capacity INTO v_capacity
  FROM public.events
  WHERE id = NEW.event_id;

  IF v_capacity IS NULL THEN
    RETURN NEW;
  END IF;

  -- Advisory lock scoped to this transaction and event: concurrent RSVPs
  -- for the same event queue here instead of double-counting.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.event_id::text, 42));

  SELECT COUNT(*)::integer INTO v_going_count
  FROM public.event_rsvps
  WHERE event_id = NEW.event_id
    AND status = 'going'
    AND id IS DISTINCT FROM NEW.id;

  IF v_going_count >= v_capacity THEN
    RAISE EXCEPTION 'Event is at capacity';
  END IF;

  RETURN NEW;
END;
$$;

-- Overlapping availability slots are now impossible at the database level
-- (the app-level read-then-insert check was racy).
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.tutor_availability
  DROP CONSTRAINT IF EXISTS tutor_availability_no_overlap;
ALTER TABLE public.tutor_availability
  ADD CONSTRAINT tutor_availability_no_overlap
  EXCLUDE USING gist (
    tutor_user_id WITH =,
    day_of_week WITH =,
    numrange(
      (extract(epoch FROM start_time))::numeric,
      (extract(epoch FROM end_time))::numeric
    ) WITH &&
  );

-- ---------------------------------------------------------------------------
-- 5. updated_at coverage for mutable tables
-- ---------------------------------------------------------------------------

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.student_tutor_assignments
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.event_attendance
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.practice_logs
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.lesson_logs
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'user_roles', 'students', 'student_tutor_assignments', 'resources',
    'announcements', 'event_attendance', 'practice_logs', 'lesson_logs'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_set_updated_at ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Aggregate / preview RPCs (SECURITY INVOKER: RLS still applies)
-- ---------------------------------------------------------------------------

-- Donation totals in SQL instead of summing every row in JS.
CREATE OR REPLACE FUNCTION public.get_donation_totals()
RETURNS TABLE (
  completed_count bigint,
  total_amount numeric,
  total_net numeric,
  total_fees numeric,
  last_30_days_amount numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COUNT(*),
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(COALESCE(net_amount, amount)), 0),
    COALESCE(SUM(COALESCE(fee_amount, 0)), 0),
    COALESCE(SUM(amount) FILTER (WHERE donated_at >= now() - interval '30 days'), 0)
  FROM public.donations
  WHERE status = 'completed';
$$;

GRANT EXECUTE ON FUNCTION public.get_donation_totals() TO authenticated;

-- Monthly donation series for dashboard charts.
CREATE OR REPLACE FUNCTION public.get_donation_monthly_totals(month_count int DEFAULT 12)
RETURNS TABLE (month date, total numeric, donation_count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT
    date_trunc('month', donated_at)::date AS month,
    COALESCE(SUM(amount), 0) AS total,
    COUNT(*) AS donation_count
  FROM public.donations
  WHERE status = 'completed'
    AND donated_at >= date_trunc('month', now()) - make_interval(months => month_count - 1)
  GROUP BY 1
  ORDER BY 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_donation_monthly_totals(int) TO authenticated;

-- Last visible message per conversation in one round-trip (was one query
-- per conversation). RLS on messages filters to conversations the caller
-- belongs to / can audit.
CREATE OR REPLACE FUNCTION public.get_conversation_last_messages(p_conversation_ids uuid[])
RETURNS TABLE (
  conversation_id uuid,
  message_id uuid,
  sender_id uuid,
  body text,
  message_created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT ON (m.conversation_id)
    m.conversation_id,
    m.id,
    m.sender_id,
    m.body,
    m.created_at
  FROM public.messages m
  WHERE m.conversation_id = ANY (p_conversation_ids)
    AND m.deleted_at IS NULL
  ORDER BY m.conversation_id, m.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_conversation_last_messages(uuid[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. Resources storage bucket (uploads happen server-side with the service
--    role after authorization; reads ride on resources-table RLS)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resources',
  'resources',
  false,
  20971520,
  ARRAY[
    'application/pdf',
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'audio/mpeg', 'audio/wav', 'audio/mp4',
    'video/mp4',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- A user may download a file iff they can see a resources row pointing at it
-- (the subquery runs under the caller's RLS on public.resources).
DROP POLICY IF EXISTS resources_storage_select ON storage.objects;
CREATE POLICY resources_storage_select
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resources'
    AND EXISTS (
      SELECT 1
      FROM public.resources r
      WHERE r.storage_path = storage.objects.name
    )
  );
