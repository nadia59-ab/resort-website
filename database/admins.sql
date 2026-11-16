-- Admin membership is managed server-side; no browser roles can read this table.
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Support databases created from the earlier project schema, which already had
-- an admins table with profile columns and auth_user_id.
ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;

ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.admins
  ALTER COLUMN full_name DROP NOT NULL,
  ALTER COLUMN email DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS admins_user_id_unique_idx
  ON public.admins (user_id)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admins FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.admins TO service_role;
