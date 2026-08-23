-- Corporate-level volunteers & hour approvals
--
-- 1. Volunteers/performers become org-wide roles (chapter_id NULL) instead of
--    chapter-scoped.
-- 2. volunteer_hours / certificates may reference no chapter (corporate hours).
-- 3. Approval rights: board approves everything (incl. corporate hours);
--    chapter presidents and program administrators approve chapter-level hours
--    only; chapter officers no longer approve hours at all.

-- ---------------------------------------------------------------------------
-- 1. Collapse chapter-scoped volunteer roles into a single org-level role
-- ---------------------------------------------------------------------------

INSERT INTO public.user_roles (user_id, chapter_id, role, status)
SELECT DISTINCT ur.user_id, NULL::uuid, 'volunteer'::public.app_role, 'active'::public.role_status
FROM public.user_roles ur
WHERE ur.role = 'volunteer'
  AND ur.chapter_id IS NOT NULL
  AND ur.status = 'active'
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles x
    WHERE x.user_id = ur.user_id
      AND x.role = 'volunteer'
      AND x.chapter_id IS NULL
  );

DELETE FROM public.user_roles
WHERE role = 'volunteer'
  AND chapter_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Allow corporate (chapterless) volunteer hours and certificates
-- ---------------------------------------------------------------------------

ALTER TABLE public.volunteer_hours ALTER COLUMN chapter_id DROP NOT NULL;
ALTER TABLE public.certificates ALTER COLUMN chapter_id DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. Updated helper functions
-- ---------------------------------------------------------------------------

-- Approval: board for everything; program administrators and the chapter's
-- president for chapter-level hours. NULL chapter (corporate hours) is
-- board-only. Chapter officers are intentionally excluded.
CREATE OR REPLACE FUNCTION public.can_approve_volunteer_hours(uid uuid, target_chapter_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_board(uid)
    OR (
      target_chapter_id IS NOT NULL
      AND (
        EXISTS (
          SELECT 1
          FROM public.user_roles ur
          WHERE ur.user_id = uid
            AND ur.role = 'program_administrator'
            AND ur.status = 'active'
        )
        OR public.has_chapter_role(
          uid,
          target_chapter_id,
          ARRAY['chapter_president']::public.app_role[]
        )
      )
    );
$$;

-- Logging: a NULL chapter (corporate hours) requires an active org-level
-- (chapterless) role — corporate volunteers, corporate officers, program
-- administrators, board. Chapter hours require membership in that chapter.
CREATE OR REPLACE FUNCTION public.is_volunteer_or_tutor_in_chapter(uid uuid, target_chapter_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN target_chapter_id IS NULL THEN EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = uid
        AND ur.status = 'active'
        AND ur.chapter_id IS NULL
    )
    ELSE public.is_org_admin(uid)
      OR public.has_chapter_role(
        uid,
        target_chapter_id,
        ARRAY['tutor', 'volunteer']::public.app_role[]
      )
  END;
$$;
