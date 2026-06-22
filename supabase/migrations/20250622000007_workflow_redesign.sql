-- Workflow redesign (part 1): enums, columns, handle_new_user
-- RLS policies that reference new enum values are in 000008 (separate transaction).

ALTER TYPE public.applicant_type ADD VALUE IF NOT EXISTS 'officer';
ALTER TYPE public.student_status ADD VALUE IF NOT EXISTS 'rejected';

ALTER TABLE public.applicants
  ADD COLUMN IF NOT EXISTS requested_role public.app_role;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- handle_new_user: parent gets student_parent role; staff gets profile only
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

DROP POLICY IF EXISTS applicants_insert_public ON public.applicants;
