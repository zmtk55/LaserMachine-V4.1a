-- PREPARATION ONLY. Not applied. Requires trusted upload/renderer and private storage.
BEGIN;
CREATE TABLE public.lm_verified_assets(
 id uuid PRIMARY KEY,
 owner_id uuid NOT NULL REFERENCES auth.users(id),
 sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'),
 mime_type text NOT NULL CHECK(mime_type IN ('image/svg+xml','image/png','image/jpeg','image/webp')),
 original_path text NOT NULL UNIQUE,
 preview_path text NOT NULL,
 status text NOT NULL CHECK(status='verified'),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lm_verified_assets ENABLE ROW LEVEL SECURITY;
-- Browser users cannot self-assert validation or download someone else's original.
REVOKE ALL ON public.lm_verified_assets FROM PUBLIC,anon,authenticated;
-- A trusted server receives storage/registry capabilities separately, never frontend keys.
-- Signed download/render URLs must be minted only after ownership or catalog-use checks.
CREATE POLICY lm_asset_owner_read ON public.lm_verified_assets FOR SELECT TO authenticated USING(owner_id=auth.uid());
GRANT SELECT ON public.lm_verified_assets TO authenticated;
COMMIT;
