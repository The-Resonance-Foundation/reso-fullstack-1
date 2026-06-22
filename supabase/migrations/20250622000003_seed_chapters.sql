-- Seed initial chapter (Houston area — update as chapters expand)

INSERT INTO public.chapters (name, slug, city, state, status)
VALUES (
  'Houston',
  'houston',
  'Houston',
  'TX',
  'active'
)
ON CONFLICT (slug) DO NOTHING;
