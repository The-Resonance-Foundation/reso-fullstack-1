-- Phase 6: donations, audit logs, PayPal webhook staging

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.donation_status AS ENUM (
  'completed',
  'refunded',
  'reversed',
  'pending'
);

CREATE TYPE public.donation_source AS ENUM (
  'paypal_webhook',
  'manual'
);

CREATE TYPE public.audit_action AS ENUM (
  'donation_received',
  'donation_refunded',
  'donation_reversed',
  'donation_manual',
  'audit_note',
  'role_changed'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid REFERENCES public.chapters (id) ON DELETE RESTRICT,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USD',
  net_amount numeric(12, 2),
  fee_amount numeric(12, 2),
  status public.donation_status NOT NULL DEFAULT 'completed',
  source public.donation_source NOT NULL DEFAULT 'paypal_webhook',
  paypal_capture_id text NOT NULL UNIQUE,
  paypal_event_id text UNIQUE,
  payer_email text,
  payer_name text,
  donated_at timestamptz NOT NULL,
  notes text,
  raw_payload jsonb,
  recorded_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  action public.audit_action NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  chapter_id uuid REFERENCES public.chapters (id) ON DELETE RESTRICT,
  summary text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.paypal_webhook_events (
  paypal_event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  donation_id uuid REFERENCES public.donations (id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX donations_status_donated_at_idx
  ON public.donations (status, donated_at DESC);

CREATE INDEX donations_source_idx
  ON public.donations (source);

CREATE INDEX donations_chapter_id_idx
  ON public.donations (chapter_id)
  WHERE chapter_id IS NOT NULL;

CREATE INDEX audit_logs_created_at_idx
  ON public.audit_logs (created_at DESC);

CREATE INDEX audit_logs_action_idx
  ON public.audit_logs (action, created_at DESC);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

CREATE TRIGGER donations_set_updated_at
  BEFORE UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
