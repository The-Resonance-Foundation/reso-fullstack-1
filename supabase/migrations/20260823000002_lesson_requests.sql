-- Parents request a lesson slot from their assigned tutor's weekly
-- availability; the tutor approves (creating the lesson) or declines.
-- State machine is enforced in RLS: parents may only flip their own pending
-- request to cancelled, tutors may only flip pending to approved/declined.

CREATE TYPE public.lesson_request_status AS ENUM (
  'pending',
  'approved',
  'declined',
  'cancelled'
);

CREATE TABLE public.lesson_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.chapters (id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  parent_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tutor_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  availability_id uuid REFERENCES public.tutor_availability (id) ON DELETE SET NULL,
  requested_start timestamptz NOT NULL,
  requested_end timestamptz NOT NULL,
  note text,
  status public.lesson_request_status NOT NULL DEFAULT 'pending',
  decided_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  decided_at timestamptz,
  lesson_id uuid REFERENCES public.lessons (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (requested_end > requested_start)
);

CREATE INDEX lesson_requests_tutor_status_idx
  ON public.lesson_requests (tutor_user_id, status);
CREATE INDEX lesson_requests_parent_idx
  ON public.lesson_requests (parent_user_id, created_at DESC);

CREATE TRIGGER lesson_requests_set_updated_at
  BEFORE UPDATE ON public.lesson_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.lesson_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY lesson_requests_select
  ON public.lesson_requests
  FOR SELECT
  TO authenticated
  USING (parent_user_id = auth.uid() OR tutor_user_id = auth.uid());

-- Parents may only file requests for their own student with a tutor actively
-- assigned to that student.
CREATE POLICY lesson_requests_insert
  ON public.lesson_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_user_id = auth.uid()
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id AND s.parent_user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.student_tutor_assignments sta
      WHERE sta.student_id = lesson_requests.student_id
        AND sta.tutor_user_id = lesson_requests.tutor_user_id
        AND sta.status = 'active'
    )
  );

CREATE POLICY lesson_requests_update_parent
  ON public.lesson_requests
  FOR UPDATE
  TO authenticated
  USING (parent_user_id = auth.uid() AND status = 'pending')
  WITH CHECK (parent_user_id = auth.uid() AND status = 'cancelled');

CREATE POLICY lesson_requests_update_tutor
  ON public.lesson_requests
  FOR UPDATE
  TO authenticated
  USING (tutor_user_id = auth.uid() AND status = 'pending')
  WITH CHECK (
    tutor_user_id = auth.uid()
    AND status IN ('approved', 'declined')
  );
