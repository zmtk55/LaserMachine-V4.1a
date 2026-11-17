BEGIN;
-- Additive initial schema, abort on any unexpected collision. No seed/import.
CREATE TABLE public.lm_admins(user_id uuid PRIMARY KEY REFERENCES auth.users(id),created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.lm_admins ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.lm_is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$SELECT EXISTS(SELECT 1 FROM public.lm_admins WHERE user_id=auth.uid())$$;
REVOKE ALL ON FUNCTION public.lm_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lm_is_admin() TO anon,authenticated;
CREATE POLICY self_membership ON public.lm_admins FOR SELECT TO authenticated USING(user_id=auth.uid());
GRANT SELECT ON public.lm_admins TO authenticated;
CREATE TABLE public.lm_products(id text PRIMARY KEY,revision integer NOT NULL CHECK(revision>0),data jsonb NOT NULL CHECK(jsonb_typeof(data)='object'),updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.lm_fonts(LIKE public.lm_products INCLUDING ALL);
CREATE TABLE public.lm_customers(LIKE public.lm_products INCLUDING ALL);
CREATE TABLE public.lm_orders(LIKE public.lm_products INCLUDING ALL);
CREATE TABLE public.lm_store_private(LIKE public.lm_products INCLUDING ALL);
CREATE TABLE public.lm_pricing(LIKE public.lm_products INCLUDING ALL);
CREATE TABLE public.lm_content(LIKE public.lm_products INCLUDING ALL);
CREATE TABLE public.lm_admin_notes(LIKE public.lm_products INCLUDING ALL);
CREATE TABLE public.lm_user_data(user_id uuid REFERENCES auth.users(id),kind text CHECK(kind IN ('favorites','notifications','order_history')),revision integer NOT NULL CHECK(revision>0),data jsonb NOT NULL,PRIMARY KEY(user_id,kind));
ALTER TABLE public.lm_user_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_data ON public.lm_user_data TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.lm_user_data TO authenticated;
DO $$DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['lm_products','lm_fonts','lm_customers','lm_orders','lm_store_private','lm_pricing','lm_content','lm_admin_notes'] LOOP
EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
EXECUTE format('CREATE POLICY admin_only ON public.%I TO authenticated USING(public.lm_is_admin()) WITH CHECK(public.lm_is_admin())',t);
EXECUTE format('REVOKE ALL ON public.%I FROM anon',t);
EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO authenticated',t);
END LOOP;END$$;
-- Public projections deliberately omit contact lists, bank data, notes and secrets.
CREATE VIEW public.lm_catalog AS SELECT id,revision,data FROM public.lm_products;
CREATE VIEW public.lm_font_catalog AS SELECT id,revision,data FROM public.lm_fonts WHERE coalesce((data->>'active')::boolean,true);
REVOKE ALL ON public.lm_catalog,public.lm_font_catalog FROM PUBLIC;
GRANT SELECT ON public.lm_catalog,public.lm_font_catalog TO anon,authenticated;
COMMIT;
