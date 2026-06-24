-- Phase 5: RLS for messaging, announcements, notifications

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_program_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.get_user_roles(uid) r
    WHERE r.role = 'program_administrator'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_chapter_president(uid uuid, target_chapter_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.get_user_roles(uid) r
    WHERE r.role = 'chapter_president'
      AND r.chapter_id = target_chapter_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_audit_message_threads(uid uuid, target_chapter_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_board(uid)
    OR public.is_program_admin(uid)
    OR public.is_chapter_president(uid, target_chapter_id);
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_member(uid uuid, target_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_members cm
    WHERE cm.conversation_id = target_conversation_id
      AND cm.user_id = uid
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_conversation(uid uuid, target_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_conversation_member(uid, target_conversation_id)
    OR EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = target_conversation_id
        AND public.can_audit_message_threads(uid, c.chapter_id)
    );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------

CREATE POLICY conversations_select
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    public.can_access_conversation(auth.uid(), id)
  );

-- ---------------------------------------------------------------------------
-- conversation_members
-- ---------------------------------------------------------------------------

CREATE POLICY conversation_members_select
  ON public.conversation_members
  FOR SELECT
  TO authenticated
  USING (
    public.can_access_conversation(auth.uid(), conversation_id)
  );

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------

CREATE POLICY messages_select
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    public.can_access_conversation(auth.uid(), conversation_id)
  );

CREATE POLICY messages_insert
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_member(auth.uid(), conversation_id)
  );

CREATE POLICY messages_update
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    sender_id = auth.uid()
    AND public.is_conversation_member(auth.uid(), conversation_id)
  )
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_member(auth.uid(), conversation_id)
  );

-- ---------------------------------------------------------------------------
-- announcements
-- ---------------------------------------------------------------------------

CREATE POLICY announcements_select
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (
    chapter_id IS NULL
    OR public.is_chapter_member(auth.uid(), chapter_id)
    OR public.is_org_admin(auth.uid())
  );

CREATE POLICY announcements_insert
  ON public.announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      chapter_id IS NOT NULL
      AND public.can_manage_chapter(auth.uid(), chapter_id)
    )
    OR (
      chapter_id IS NULL
      AND public.is_board(auth.uid())
    )
  );

CREATE POLICY announcements_update
  ON public.announcements
  FOR UPDATE
  TO authenticated
  USING (
    (
      chapter_id IS NOT NULL
      AND public.can_manage_chapter(auth.uid(), chapter_id)
    )
    OR (
      chapter_id IS NULL
      AND public.is_board(auth.uid())
    )
  )
  WITH CHECK (
    (
      chapter_id IS NOT NULL
      AND public.can_manage_chapter(auth.uid(), chapter_id)
    )
    OR (
      chapter_id IS NULL
      AND public.is_board(auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

CREATE POLICY notifications_select
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notifications_update
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
