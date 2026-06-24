-- Phase 4: volunteer hours and certificates

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.volunteer_hour_category AS ENUM (
  'teaching',
  'event_support',
  'admin_work'
);

CREATE TYPE public.volunteer_hour_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

CREATE TYPE public.certificate_type AS ENUM (
  'volunteer_service'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.volunteer_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES public.chapters (id) ON DELETE RESTRICT,
  category public.volunteer_hour_category NOT NULL,
  hours numeric(5, 2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  activity_date date NOT NULL,
  description text,
  status public.volunteer_hour_status NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejected_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  rejected_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (activity_date <= CURRENT_DATE)
);

CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES public.chapters (id) ON DELETE RESTRICT,
  certificate_type public.certificate_type NOT NULL DEFAULT 'volunteer_service',
  title text NOT NULL,
  total_hours numeric(6, 2) NOT NULL CHECK (total_hours > 0),
  period_start date NOT NULL,
  period_end date NOT NULL,
  storage_path text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  issued_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  source_hour_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX volunteer_hours_chapter_status_idx
  ON public.volunteer_hours (chapter_id, status);

CREATE INDEX volunteer_hours_user_activity_idx
  ON public.volunteer_hours (user_id, activity_date DESC);

CREATE INDEX certificates_user_chapter_idx
  ON public.certificates (user_id, chapter_id, issued_at DESC);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

CREATE TRIGGER volunteer_hours_set_updated_at
  BEFORE UPDATE ON public.volunteer_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Storage bucket (private certificates)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  false,
  5242880,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;
