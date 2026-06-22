-- Student enrollment fields on applicants + auth user lookup helper

ALTER TABLE public.applicants
  ADD COLUMN IF NOT EXISTS parent_name text,
  ADD COLUMN IF NOT EXISTS parent_email text,
  ADD COLUMN IF NOT EXISTS student_name text,
  ADD COLUMN IF NOT EXISTS linked_student_id uuid REFERENCES public.students (id) ON DELETE SET NULL;

UPDATE public.applicants
SET
  student_name = full_name,
  parent_email = email,
  parent_name = full_name
WHERE type = 'student'
  AND student_name IS NULL;

CREATE OR REPLACE FUNCTION public.get_auth_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(user_email) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_auth_user_id_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_user_id_by_email(text) TO service_role;
