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
