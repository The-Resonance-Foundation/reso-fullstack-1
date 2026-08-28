-- Optional personal address that receives a copy of every portal email.
-- Members sign in with their account email, which may be an organization
-- address they check rarely; this lets every notification also reach an
-- address they actually read.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_email text;

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (lower(email));
