BEGIN;

ALTER TABLE public.ordenes_trabajo
  ADD COLUMN IF NOT EXISTS foto_url text;

COMMIT;

