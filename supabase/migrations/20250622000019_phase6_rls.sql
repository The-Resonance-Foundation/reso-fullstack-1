-- Phase 6: RLS for donations and audit logs

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_corporate_officer(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.get_user_roles(uid) r
    WHERE r.role = 'corporate_officer'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_program_administrator(uid uuid)
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

CREATE OR REPLACE FUNCTION public.can_view_donations(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_board(uid)
    OR public.is_program_administrator(uid)
    OR public.is_corporate_officer(uid);
$$;

CREATE OR REPLACE FUNCTION public.can_manage_donations(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_board(uid)
    OR public.is_corporate_officer(uid);
$$;

CREATE OR REPLACE FUNCTION public.can_view_audit_logs(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_board(uid)
    OR public.is_program_administrator(uid);
$$;

CREATE OR REPLACE FUNCTION public.can_write_audit_logs(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_board(uid)
    OR public.is_program_administrator(uid);
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paypal_webhook_events ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- donations
-- ---------------------------------------------------------------------------

CREATE POLICY donations_select
  ON public.donations
  FOR SELECT
  TO authenticated
  USING (public.can_view_donations(auth.uid()));

CREATE POLICY donations_update
  ON public.donations
  FOR UPDATE
  TO authenticated
  USING (public.can_manage_donations(auth.uid()))
  WITH CHECK (public.can_manage_donations(auth.uid()));

-- No INSERT/DELETE for authenticated clients — webhook uses service role.

-- ---------------------------------------------------------------------------
-- audit_logs (append-only for authenticated users)
-- ---------------------------------------------------------------------------

CREATE POLICY audit_logs_select
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.can_view_audit_logs(auth.uid()));

CREATE POLICY audit_logs_insert
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_write_audit_logs(auth.uid())
    AND actor_user_id = auth.uid()
  );

-- paypal_webhook_events: no policies — service role only
