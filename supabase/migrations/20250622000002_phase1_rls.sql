-- Phase 1: RLS helpers and policies

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER avoids user_roles recursion)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_roles(uid uuid)
RETURNS TABLE (role public.app_role, chapter_id uuid, status public.role_status)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role, ur.chapter_id, ur.status
  FROM public.user_roles ur
  WHERE ur.user_id = uid
    AND ur.status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.is_board(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.get_user_roles(uid) r
    WHERE r.role = 'board_of_director'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.get_user_roles(uid) r
    WHERE r.role IN ('board_of_director', 'program_administrator', 'corporate_officer')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_chapter_role(
  uid uuid,
  target_chapter_id uuid,
  allowed_roles public.app_role[]
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.get_user_roles(uid) r
    WHERE r.role = ANY (allowed_roles)
      AND (
        r.chapter_id = target_chapter_id
        OR r.role IN ('board_of_director', 'program_administrator', 'corporate_officer')
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_chapter(uid uuid, target_chapter_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_board(uid)
    OR public.has_chapter_role(
      uid,
      target_chapter_id,
      ARRAY['chapter_officer', 'chapter_president']::public.app_role[]
    );
$$;

-- ---------------------------------------------------------------------------
-- chapters
-- ---------------------------------------------------------------------------

CREATE POLICY chapters_select_authenticated
  ON public.chapters
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY chapters_select_anon
  ON public.chapters
  FOR SELECT
  TO anon
  USING (status = 'active');

CREATE POLICY chapters_insert_board
  ON public.chapters
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_board(auth.uid()));

CREATE POLICY chapters_update_board
  ON public.chapters
  FOR UPDATE
  TO authenticated
  USING (public.is_board(auth.uid()))
  WITH CHECK (public.is_board(auth.uid()));

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_org_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.get_user_roles(auth.uid()) r ON true
      WHERE s.parent_user_id = profiles.id
        AND r.role IN ('tutor', 'chapter_officer', 'chapter_president')
        AND r.chapter_id = s.chapter_id
    )
  );

CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_board(auth.uid()))
  WITH CHECK (id = auth.uid() OR public.is_board(auth.uid()));

-- ---------------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------------

CREATE POLICY user_roles_select_own
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_org_admin(auth.uid())
    OR (
      chapter_id IS NOT NULL
      AND public.can_manage_chapter(auth.uid(), chapter_id)
    )
  );

CREATE POLICY user_roles_insert_admin
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_board(auth.uid())
    OR (
      chapter_id IS NOT NULL
      AND public.can_manage_chapter(auth.uid(), chapter_id)
    )
  );

CREATE POLICY user_roles_update_admin
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    public.is_board(auth.uid())
    OR (
      chapter_id IS NOT NULL
      AND public.can_manage_chapter(auth.uid(), chapter_id)
    )
  )
  WITH CHECK (
    public.is_board(auth.uid())
    OR (
      chapter_id IS NOT NULL
      AND public.can_manage_chapter(auth.uid(), chapter_id)
    )
  );

-- ---------------------------------------------------------------------------
-- students
-- ---------------------------------------------------------------------------

CREATE POLICY students_select
  ON public.students
  FOR SELECT
  TO authenticated
  USING (
    parent_user_id = auth.uid()
    OR public.is_org_admin(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
    OR public.has_chapter_role(
      auth.uid(),
      chapter_id,
      ARRAY['tutor']::public.app_role[]
    )
  );

CREATE POLICY students_insert_parent
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_user_id = auth.uid()
    OR public.is_board(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  );

CREATE POLICY students_update
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (
    parent_user_id = auth.uid()
    OR public.is_board(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  )
  WITH CHECK (
    parent_user_id = auth.uid()
    OR public.is_board(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  );

-- ---------------------------------------------------------------------------
-- guardian_consents
-- ---------------------------------------------------------------------------

CREATE POLICY guardian_consents_select
  ON public.guardian_consents
  FOR SELECT
  TO authenticated
  USING (
    signed_by_user_id = auth.uid()
    OR public.is_org_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = guardian_consents.student_id
        AND (
          s.parent_user_id = auth.uid()
          OR public.can_manage_chapter(auth.uid(), s.chapter_id)
        )
    )
  );

CREATE POLICY guardian_consents_insert
  ON public.guardian_consents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    signed_by_user_id = auth.uid()
    OR public.is_board(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = guardian_consents.student_id
        AND s.parent_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- applicants
-- ---------------------------------------------------------------------------

CREATE POLICY applicants_insert_public
  ON public.applicants
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    stage = 'applied'
    AND converted_user_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.chapters c
      WHERE c.id = chapter_id
        AND c.status = 'active'
    )
  );

CREATE POLICY applicants_select
  ON public.applicants
  FOR SELECT
  TO authenticated
  USING (
    public.is_org_admin(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
    OR (
      email = (auth.jwt() ->> 'email')
      AND stage IN ('applied', 'accepted')
    )
  );

CREATE POLICY applicants_update
  ON public.applicants
  FOR UPDATE
  TO authenticated
  USING (
    public.is_org_admin(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  )
  WITH CHECK (
    public.is_org_admin(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  );
