-- Direct (member-to-member) conversations alongside tutor_student threads.
-- Direct rows have no student/tutor pair; membership lives solely in
-- conversation_members. Creation goes through the service-role client after
-- app-level authorization (parents <-> staff, staff <-> staff), so no INSERT
-- policies are added here. Existing SELECT/INSERT policies on messages and
-- members are membership-based and cover direct threads unchanged.
-- NOTE: 'direct' must not be referenced elsewhere in this file — new enum
-- values cannot be used inside the transaction that adds them.

ALTER TYPE public.conversation_type ADD VALUE IF NOT EXISTS 'direct';

ALTER TABLE public.conversations ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE public.conversations ALTER COLUMN tutor_user_id DROP NOT NULL;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL;

-- tutor_student threads keep their pair; every other type carries no pair.
ALTER TABLE public.conversations ADD CONSTRAINT conversations_type_shape CHECK (
  (
    conversation_type = 'tutor_student'
    AND student_id IS NOT NULL
    AND tutor_user_id IS NOT NULL
  )
  OR (
    conversation_type <> 'tutor_student'
    AND student_id IS NULL
    AND tutor_user_id IS NULL
  )
);
