-- Phase 4: RLS for volunteer hours and certificates

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_approve_volunteer_hours(uid uuid, target_chapter_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_board(uid)
    OR public.can_manage_chapter(uid, target_chapter_id);
$$;

CREATE OR REPLACE FUNCTION public.is_volunteer_or_tutor_in_chapter(uid uuid, target_chapter_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_org_admin(uid)
    OR public.has_chapter_role(
      uid,
      target_chapter_id,
      ARRAY['tutor', 'volunteer']::public.app_role[]
    );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.volunteer_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- volunteer_hours
-- ---------------------------------------------------------------------------

CREATE POLICY volunteer_hours_select
  ON public.volunteer_hours
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.can_approve_volunteer_hours(auth.uid(), chapter_id)
    OR public.is_org_admin(auth.uid())
  );

CREATE POLICY volunteer_hours_insert
  ON public.volunteer_hours
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_volunteer_or_tutor_in_chapter(auth.uid(), chapter_id)
  );

CREATE POLICY volunteer_hours_update
  ON public.volunteer_hours
  FOR UPDATE
  TO authenticated
  USING (
    (
      user_id = auth.uid()
      AND status = 'pending'
    )
    OR public.can_approve_volunteer_hours(auth.uid(), chapter_id)
    OR public.is_board(auth.uid())
  )
  WITH CHECK (
    (
      user_id = auth.uid()
      AND status = 'pending'
    )
    OR public.can_approve_volunteer_hours(auth.uid(), chapter_id)
    OR public.is_board(auth.uid())
  );

CREATE POLICY volunteer_hours_delete
  ON public.volunteer_hours
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND status = 'pending'
  );

-- ---------------------------------------------------------------------------
-- certificates (read via RLS; insert via service role only)
-- ---------------------------------------------------------------------------

CREATE POLICY certificates_select
  ON public.certificates
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.can_approve_volunteer_hours(auth.uid(), chapter_id)
    OR public.is_org_admin(auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Storage policies for certificates bucket
-- ---------------------------------------------------------------------------

CREATE POLICY certificates_storage_select
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'certificates'
    AND (
      EXISTS (
        SELECT 1
        FROM public.certificates c
        WHERE c.storage_path = storage.objects.name
          AND (
            c.user_id = auth.uid()
            OR public.can_approve_volunteer_hours(auth.uid(), c.chapter_id)
            OR public.is_org_admin(auth.uid())
          )
      )
    )
  );
