BEGIN;
CREATE TABLE public.lm_design_history(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
 name text NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
 payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object' AND octet_length(payload::text)<=5000000),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lm_design_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lm_design_history FROM PUBLIC,anon;
GRANT SELECT,INSERT,DELETE ON public.lm_design_history TO authenticated;
CREATE POLICY owner_design_history ON public.lm_design_history TO authenticated USING(owner_id=auth.uid()) WITH CHECK(owner_id=auth.uid());
COMMIT;
