-- Guest onboarding: corporate-level applications and onboarding notes.
--
-- 1. Applications for corporate-level positions (corporate officer, program
--    administrator) carry no chapter, so applicants.chapter_id becomes
--    nullable and the insert policy learns the corporate/chapter split.
-- 2. Guests can leave a note on their profile so the board knows which role
--    to assign when onboarding an existing officer who did not apply.

ALTER TABLE public.applicants ALTER COLUMN chapter_id DROP NOT NULL;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_note text;

DROP POLICY IF EXISTS applicants_insert_staff ON public.applicants;

CREATE POLICY applicants_insert_staff
  ON public.applicants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    converted_user_id = auth.uid()
    AND stage = 'applied'
    AND type IN ('tutor', 'officer', 'volunteer')
    AND (
      -- Corporate-level positions are never tied to a chapter.
      (
        type = 'officer'
        AND requested_role IN ('corporate_officer', 'program_administrator')
        AND chapter_id IS NULL
      )
      OR
      -- Chapter positions require an active chapter.
      (
        chapter_id IS NOT NULL
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
      )
    )
  );
