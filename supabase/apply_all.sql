-- Phase 1: core schema (chapters, profiles, roles, students, consents, applicants)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.app_role AS ENUM (
  'student_parent',
  'tutor',
  'volunteer',
  'chapter_officer',
  'chapter_president',
  'corporate_officer',
  'program_administrator',
  'board_of_director'
);

CREATE TYPE public.role_status AS ENUM ('pending', 'active', 'inactive');

CREATE TYPE public.chapter_status AS ENUM ('active', 'inactive');

CREATE TYPE public.student_status AS ENUM ('pending', 'active', 'inactive', 'alumni');

CREATE TYPE public.applicant_type AS ENUM ('student', 'tutor', 'volunteer');

CREATE TYPE public.applicant_stage AS ENUM (
  'interested',
  'applied',
  'accepted',
  'active',
  'alumni'
);

CREATE TYPE public.consent_type AS ENUM (
  'photo_release',
  'liability_waiver',
  'code_of_conduct',
  'financial_aid'
);

CREATE TYPE public.skill_level AS ENUM (
  'beginner',
  'intermediate',
  'advanced'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  city text,
  state text,
  status public.chapter_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES public.chapters (id) ON DELETE SET NULL,
  role public.app_role NOT NULL,
  status public.role_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, chapter_id)
);

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES public.chapters (id) ON DELETE RESTRICT,
  first_name text NOT NULL,
  last_name text NOT NULL,
  instrument text,
  skill_level public.skill_level,
  financial_aid boolean NOT NULL DEFAULT false,
  status public.student_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.guardian_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  consent_type public.consent_type NOT NULL,
  signed_by_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  signed_at timestamptz NOT NULL DEFAULT now(),
  document_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.applicant_type NOT NULL,
  chapter_id uuid NOT NULL REFERENCES public.chapters (id) ON DELETE RESTRICT,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  instrument text,
  skill_level public.skill_level,
  message text,
  stage public.applicant_stage NOT NULL DEFAULT 'applied',
  converted_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX idx_user_roles_chapter_id ON public.user_roles (chapter_id);
CREATE INDEX idx_students_parent_user_id ON public.students (parent_user_id);
CREATE INDEX idx_students_chapter_id ON public.students (chapter_id);
CREATE INDEX idx_applicants_chapter_id ON public.applicants (chapter_id);
CREATE INDEX idx_applicants_stage ON public.applicants (stage);
CREATE INDEX idx_applicants_type ON public.applicants (type);
CREATE INDEX idx_applicants_email ON public.applicants (email);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER applicants_set_updated_at
  BEFORE UPDATE ON public.applicants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- handle_new_user: profile + optional parent role on signup
-- ---------------------------------------------------------------------------

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

  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    v_full_name,
    NEW.raw_user_meta_data ->> 'phone'
  );

  IF v_signup_type = 'parent' AND v_chapter_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, chapter_id, role, status)
    VALUES (NEW.id, v_chapter_id, 'student_parent', 'active');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
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
-- Seed initial chapter (Houston area — update as chapters expand)

INSERT INTO public.chapters (name, slug, city, state, status)
VALUES (
  'Houston',
  'houston',
  'Houston',
  'TX',
  'active'
)
ON CONFLICT (slug) DO NOTHING;
