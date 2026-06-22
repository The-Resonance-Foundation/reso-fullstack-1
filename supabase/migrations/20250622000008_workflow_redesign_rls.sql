-- Workflow redesign (part 2): applicant RLS (must run after officer enum value exists)

CREATE POLICY applicants_insert_staff
  ON public.applicants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    converted_user_id = auth.uid()
    AND stage = 'applied'
    AND type IN ('tutor', 'officer', 'volunteer')
    AND EXISTS (
      SELECT 1
      FROM public.chapters c
      WHERE c.id = chapter_id
        AND c.status = 'active'
    )
    AND (
      type <> 'officer'
      OR requested_role IN ('chapter_officer', 'chapter_president')
    )
  );

DROP POLICY IF EXISTS applicants_select ON public.applicants;

CREATE POLICY applicants_select
  ON public.applicants
  FOR SELECT
  TO authenticated
  USING (
    public.is_org_admin(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
    OR (
      converted_user_id = auth.uid()
      AND stage IN ('applied', 'accepted')
    )
  );
