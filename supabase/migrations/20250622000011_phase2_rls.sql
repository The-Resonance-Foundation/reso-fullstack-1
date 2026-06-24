-- Phase 2: RLS helpers and policies

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_assigned_tutor(uid uuid, target_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_tutor_assignments sta
    WHERE sta.student_id = target_student_id
      AND sta.tutor_user_id = uid
      AND sta.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_student_parent(uid uuid, target_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.id = target_student_id
      AND s.parent_user_id = uid
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_student(uid uuid, target_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_student_parent(uid, target_student_id)
    OR public.is_assigned_tutor(uid, target_student_id)
    OR EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = target_student_id
        AND (
          public.is_org_admin(uid)
          OR public.can_manage_chapter(uid, s.chapter_id)
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.is_chapter_member(uid uuid, target_chapter_id uuid)
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
      ARRAY[
        'student_parent',
        'tutor',
        'volunteer',
        'chapter_officer',
        'chapter_president'
      ]::public.app_role[]
    );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.student_tutor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- student_tutor_assignments
-- ---------------------------------------------------------------------------

CREATE POLICY student_tutor_assignments_select
  ON public.student_tutor_assignments
  FOR SELECT
  TO authenticated
  USING (
    tutor_user_id = auth.uid()
    OR public.is_student_parent(auth.uid(), student_id)
    OR public.is_org_admin(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  );

CREATE POLICY student_tutor_assignments_insert
  ON public.student_tutor_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_board(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  );

CREATE POLICY student_tutor_assignments_update
  ON public.student_tutor_assignments
  FOR UPDATE
  TO authenticated
  USING (
    public.is_board(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  )
  WITH CHECK (
    public.is_board(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  );

-- ---------------------------------------------------------------------------
-- tutor_availability
-- ---------------------------------------------------------------------------

CREATE POLICY tutor_availability_select
  ON public.tutor_availability
  FOR SELECT
  TO authenticated
  USING (
    tutor_user_id = auth.uid()
    OR public.is_org_admin(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
    OR public.has_chapter_role(
      auth.uid(),
      chapter_id,
      ARRAY['student_parent']::public.app_role[]
    )
  );

CREATE POLICY tutor_availability_insert
  ON public.tutor_availability
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tutor_user_id = auth.uid()
    AND public.has_chapter_role(
      auth.uid(),
      chapter_id,
      ARRAY['tutor']::public.app_role[]
    )
  );

CREATE POLICY tutor_availability_update
  ON public.tutor_availability
  FOR UPDATE
  TO authenticated
  USING (tutor_user_id = auth.uid())
  WITH CHECK (tutor_user_id = auth.uid());

CREATE POLICY tutor_availability_delete
  ON public.tutor_availability
  FOR DELETE
  TO authenticated
  USING (tutor_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- lessons
-- ---------------------------------------------------------------------------

CREATE POLICY lessons_select
  ON public.lessons
  FOR SELECT
  TO authenticated
  USING (
    public.can_access_student(auth.uid(), student_id)
    OR tutor_user_id = auth.uid()
  );

CREATE POLICY lessons_insert
  ON public.lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      tutor_user_id = auth.uid()
      AND public.is_assigned_tutor(auth.uid(), student_id)
    )
    OR public.is_board(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  );

CREATE POLICY lessons_update
  ON public.lessons
  FOR UPDATE
  TO authenticated
  USING (
    tutor_user_id = auth.uid()
    OR public.is_board(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  )
  WITH CHECK (
    tutor_user_id = auth.uid()
    OR public.is_board(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  );

-- ---------------------------------------------------------------------------
-- lesson_logs
-- ---------------------------------------------------------------------------

CREATE POLICY lesson_logs_select
  ON public.lesson_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_logs.lesson_id
        AND (
          public.can_access_student(auth.uid(), l.student_id)
          OR l.tutor_user_id = auth.uid()
        )
    )
  );

CREATE POLICY lesson_logs_insert
  ON public.lesson_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_logs.lesson_id
        AND (
          l.tutor_user_id = auth.uid()
          OR public.can_manage_chapter(auth.uid(), l.chapter_id)
          OR public.is_board(auth.uid())
        )
    )
  );

CREATE POLICY lesson_logs_update
  ON public.lesson_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_logs.lesson_id
        AND (
          l.tutor_user_id = auth.uid()
          OR public.can_manage_chapter(auth.uid(), l.chapter_id)
          OR public.is_board(auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_logs.lesson_id
        AND (
          l.tutor_user_id = auth.uid()
          OR public.can_manage_chapter(auth.uid(), l.chapter_id)
          OR public.is_board(auth.uid())
        )
    )
  );

-- ---------------------------------------------------------------------------
-- practice_logs
-- ---------------------------------------------------------------------------

CREATE POLICY practice_logs_select
  ON public.practice_logs
  FOR SELECT
  TO authenticated
  USING (
    public.can_access_student(auth.uid(), student_id)
  );

CREATE POLICY practice_logs_insert
  ON public.practice_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    logged_by = auth.uid()
    AND public.is_student_parent(auth.uid(), student_id)
  );

CREATE POLICY practice_logs_update
  ON public.practice_logs
  FOR UPDATE
  TO authenticated
  USING (
    logged_by = auth.uid()
    AND public.is_student_parent(auth.uid(), student_id)
  )
  WITH CHECK (
    logged_by = auth.uid()
    AND public.is_student_parent(auth.uid(), student_id)
  );

CREATE POLICY practice_logs_delete
  ON public.practice_logs
  FOR DELETE
  TO authenticated
  USING (
    logged_by = auth.uid()
    AND public.is_student_parent(auth.uid(), student_id)
  );

-- ---------------------------------------------------------------------------
-- assignments
-- ---------------------------------------------------------------------------

CREATE POLICY assignments_select
  ON public.assignments
  FOR SELECT
  TO authenticated
  USING (
    public.can_access_student(auth.uid(), student_id)
    OR tutor_user_id = auth.uid()
  );

CREATE POLICY assignments_insert
  ON public.assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      tutor_user_id = auth.uid()
      AND public.is_assigned_tutor(auth.uid(), student_id)
    )
    OR public.is_board(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = assignments.student_id
        AND public.can_manage_chapter(auth.uid(), s.chapter_id)
    )
  );

CREATE POLICY assignments_update
  ON public.assignments
  FOR UPDATE
  TO authenticated
  USING (
    tutor_user_id = auth.uid()
    OR public.is_student_parent(auth.uid(), student_id)
    OR public.is_board(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = assignments.student_id
        AND public.can_manage_chapter(auth.uid(), s.chapter_id)
    )
  )
  WITH CHECK (
    tutor_user_id = auth.uid()
    OR public.is_student_parent(auth.uid(), student_id)
    OR public.is_board(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = assignments.student_id
        AND public.can_manage_chapter(auth.uid(), s.chapter_id)
    )
  );

-- ---------------------------------------------------------------------------
-- resources
-- ---------------------------------------------------------------------------

CREATE POLICY resources_select
  ON public.resources
  FOR SELECT
  TO authenticated
  USING (
    (
      student_id IS NULL
      AND public.is_chapter_member(auth.uid(), chapter_id)
    )
    OR (
      student_id IS NOT NULL
      AND public.can_access_student(auth.uid(), student_id)
    )
    OR public.is_org_admin(auth.uid())
  );

CREATE POLICY resources_insert
  ON public.resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND (
      public.is_board(auth.uid())
      OR public.can_manage_chapter(auth.uid(), chapter_id)
      OR (
        public.has_chapter_role(
          auth.uid(),
          chapter_id,
          ARRAY['tutor']::public.app_role[]
        )
        AND (
          student_id IS NULL
          OR public.is_assigned_tutor(auth.uid(), student_id)
        )
      )
    )
  );

CREATE POLICY resources_update
  ON public.resources
  FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR public.is_board(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  )
  WITH CHECK (
    uploaded_by = auth.uid()
    OR public.is_board(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  );

CREATE POLICY resources_delete
  ON public.resources
  FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR public.is_board(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  );
