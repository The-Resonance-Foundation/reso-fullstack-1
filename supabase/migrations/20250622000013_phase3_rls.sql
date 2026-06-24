-- Phase 3: RLS policies and capacity guard

-- ---------------------------------------------------------------------------
-- Capacity guard (prevents race on full events)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_event_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capacity integer;
  v_going_count integer;
BEGIN
  IF NEW.status <> 'going' THEN
    RETURN NEW;
  END IF;

  SELECT capacity INTO v_capacity
  FROM public.events
  WHERE id = NEW.event_id;

  IF v_capacity IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)::integer INTO v_going_count
  FROM public.event_rsvps
  WHERE event_id = NEW.event_id
    AND status = 'going'
    AND id IS DISTINCT FROM NEW.id;

  IF v_going_count >= v_capacity THEN
    RAISE EXCEPTION 'Event is at capacity';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER event_rsvps_capacity_guard
  BEFORE INSERT OR UPDATE OF status ON public.event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_event_capacity();

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------

CREATE POLICY events_select
  ON public.events
  FOR SELECT
  TO authenticated
  USING (
    status IN ('published', 'completed')
    AND (
      chapter_id IS NULL
      OR public.is_chapter_member(auth.uid(), chapter_id)
      OR public.is_org_admin(auth.uid())
    )
    OR public.is_org_admin(auth.uid())
    OR (
      chapter_id IS NOT NULL
      AND public.can_manage_chapter(auth.uid(), chapter_id)
    )
  );

CREATE POLICY events_insert
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      chapter_id IS NOT NULL
      AND public.can_manage_chapter(auth.uid(), chapter_id)
    )
    OR (
      chapter_id IS NULL
      AND public.is_org_admin(auth.uid())
    )
  );

CREATE POLICY events_update
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    (
      chapter_id IS NOT NULL
      AND public.can_manage_chapter(auth.uid(), chapter_id)
    )
    OR (
      chapter_id IS NULL
      AND public.is_org_admin(auth.uid())
    )
  )
  WITH CHECK (
    (
      chapter_id IS NOT NULL
      AND public.can_manage_chapter(auth.uid(), chapter_id)
    )
    OR (
      chapter_id IS NULL
      AND public.is_org_admin(auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- event_rsvps
-- ---------------------------------------------------------------------------

CREATE POLICY event_rsvps_select
  ON public.event_rsvps
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_rsvps.event_id
        AND (
          public.is_org_admin(auth.uid())
          OR (
            e.chapter_id IS NOT NULL
            AND public.can_manage_chapter(auth.uid(), e.chapter_id)
          )
        )
    )
  );

CREATE POLICY event_rsvps_insert
  ON public.event_rsvps
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_rsvps.event_id
        AND e.status = 'published'
        AND (
          e.chapter_id IS NULL
          OR public.is_chapter_member(auth.uid(), e.chapter_id)
          OR public.is_org_admin(auth.uid())
        )
    )
  );

CREATE POLICY event_rsvps_update
  ON public.event_rsvps
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY event_rsvps_delete
  ON public.event_rsvps
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- event_attendance
-- ---------------------------------------------------------------------------

CREATE POLICY event_attendance_select
  ON public.event_attendance
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_attendance.event_id
        AND (
          public.is_org_admin(auth.uid())
          OR (
            e.chapter_id IS NOT NULL
            AND public.can_manage_chapter(auth.uid(), e.chapter_id)
          )
        )
    )
  );

CREATE POLICY event_attendance_insert
  ON public.event_attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_attendance.event_id
        AND (
          public.is_org_admin(auth.uid())
          OR (
            e.chapter_id IS NOT NULL
            AND public.can_manage_chapter(auth.uid(), e.chapter_id)
          )
        )
    )
  );

CREATE POLICY event_attendance_update
  ON public.event_attendance
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_attendance.event_id
        AND (
          public.is_org_admin(auth.uid())
          OR (
            e.chapter_id IS NOT NULL
            AND public.can_manage_chapter(auth.uid(), e.chapter_id)
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_attendance.event_id
        AND (
          public.is_org_admin(auth.uid())
          OR (
            e.chapter_id IS NOT NULL
            AND public.can_manage_chapter(auth.uid(), e.chapter_id)
          )
        )
    )
  );
