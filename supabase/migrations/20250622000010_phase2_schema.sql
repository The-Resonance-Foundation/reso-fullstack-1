-- Phase 2: lessons, practice, assignments, resources, tutor assignments

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.lesson_status AS ENUM (
  'scheduled',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE public.attendance_status AS ENUM (
  'present',
  'absent',
  'late',
  'excused'
);

CREATE TYPE public.assignment_status AS ENUM (
  'assigned',
  'submitted',
  'completed'
);

CREATE TYPE public.resource_storage_type AS ENUM (
  'link',
  'drive',
  'supabase'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.student_tutor_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  tutor_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  chapter_id uuid NOT NULL REFERENCES public.chapters (id) ON DELETE RESTRICT,
  status public.role_status NOT NULL DEFAULT 'active',
  assigned_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, tutor_user_id)
);

CREATE TABLE public.tutor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES public.chapters (id) ON DELETE RESTRICT,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.chapters (id) ON DELETE RESTRICT,
  tutor_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  status public.lesson_status NOT NULL DEFAULT 'scheduled',
  location text,
  meeting_link text,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (scheduled_end > scheduled_start)
);

CREATE TABLE public.lesson_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL UNIQUE REFERENCES public.lessons (id) ON DELETE CASCADE,
  attendance public.attendance_status NOT NULL,
  topics_covered text,
  tutor_notes text,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.practice_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  minutes integer NOT NULL CHECK (minutes > 0),
  practiced_on date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  logged_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  tutor_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES public.lessons (id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  due_date date,
  status public.assignment_status NOT NULL DEFAULT 'assigned',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.chapters (id) ON DELETE RESTRICT,
  student_id uuid REFERENCES public.students (id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  storage_type public.resource_storage_type NOT NULL,
  url text,
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (url IS NOT NULL OR storage_path IS NOT NULL)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX student_tutor_assignments_student_idx
  ON public.student_tutor_assignments (student_id);

CREATE INDEX student_tutor_assignments_tutor_idx
  ON public.student_tutor_assignments (tutor_user_id);

CREATE INDEX tutor_availability_tutor_chapter_idx
  ON public.tutor_availability (tutor_user_id, chapter_id);

CREATE INDEX lessons_chapter_start_idx
  ON public.lessons (chapter_id, scheduled_start);

CREATE INDEX lessons_student_idx
  ON public.lessons (student_id);

CREATE INDEX lessons_tutor_idx
  ON public.lessons (tutor_user_id);

CREATE INDEX practice_logs_student_idx
  ON public.practice_logs (student_id, practiced_on DESC);

CREATE INDEX assignments_student_idx
  ON public.assignments (student_id);

CREATE INDEX resources_chapter_idx
  ON public.resources (chapter_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

CREATE TRIGGER lessons_set_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER assignments_set_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
